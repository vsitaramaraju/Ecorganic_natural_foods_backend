const prisma = require("../src/utils/prisma");
const { evaluateCoupon } = require("../src/utils/couponUtils");
const { unitLabel } = require("../src/utils/priceUnit");
const { emitToUser } = require("../src/socket");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, couponCode } = req.body;

    // 1. Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 1b. Make sure every item still has enough stock before we go any
    // further. This covers plain fixed-price products as well as
    // per_kg / per_500g / per_250g / per_100g products — in every case
    // `quantity` is the number of packs of that product being bought, and
    // `stock` is the number of packs available, so they compare directly.
    const outOfStockItems = cartItems.filter(
      item => item.quantity > item.product.stock
    );

    if (outOfStockItems.length > 0) {
      return res.status(409).json({
        message: "Some items in your cart don't have enough stock",
        items: outOfStockItems.map(item => ({
          productId: item.productId,
          name: item.product.name,
          requested: item.quantity,
          available: item.product.stock,
          unit: unitLabel(item.product.priceUnit)
        }))
      });
    }

    // 2. Calculate subtotal
    let subtotalAmount = 0;
    cartItems.forEach(item => {
      subtotalAmount += item.product.price * item.quantity;
    });

    // 3. Validate coupon (if provided) and compute discount server-side
    let coupon = null;
    let discountAmount = 0;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });

      if (!coupon) {
        return res.status(404).json({ message: "Invalid coupon code" });
      }

      const result = await evaluateCoupon({ coupon, userId, subtotalAmount });

      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }

      discountAmount = result.discountAmount;
    }

    const totalAmount =
      Math.round((subtotalAmount - discountAmount) * 100) / 100;

    // 4. Create order, increment coupon usage, and clear cart atomically
    const order = await prisma.$transaction(async tx => {
      const created = await tx.order.create({
        data: {
          userId,
          addressId,
          subtotalAmount,
          discountAmount,
          totalAmount,
          couponId: coupon ? coupon.id : null,
          couponCode: coupon ? coupon.code : null,
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        },
        include: { items: true }
      });

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }

      // 4b. Decrement stock for every purchased product. The `stock: { gte:
      // item.quantity }` guard makes this safe against race conditions —
      // e.g. two people checking out the last pack at the same time. If
      // stock dropped below what's needed between our check above and now,
      // updatedCount will be 0 and we abort the whole transaction so no
      // order is created without matching stock being reserved.
      for (const item of cartItems) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (updateResult.count === 0) {
          throw new Error(
            `"${item.product.name}" no longer has enough stock (only some ${unitLabel(item.product.priceUnit)} left). Please update your cart and try again.`
          );
        }
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    res.status(201).json(order);
  } catch (error) {
    // Stock ran out for someone mid-checkout (race condition caught inside
    // the transaction) — this is a client-fixable conflict, not a server
    // error, so it gets its own status code.
    if (error.message && error.message.includes("no longer has enough stock")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        },
        address: true,
        coupon: true
      }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        address: true,
        items: {
          include: { product: true }
        },
        coupon: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await prisma.$transaction(async tx => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!existing) {
        throw new Error("Order not found");
      }

      const wasCancelled = existing.status === "CANCELLED";
      const isNowCancelled = status === "CANCELLED";

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status }
      });

      // Restore stock if the order is being cancelled (and wasn't already).
      // Covers per_kg / per_500g / per_250g / per_100g / fixed products the
      // same way createOrder decrements them — 1 order item quantity =
      // 1 pack of that product's unit put back into stock.
      if (isNowCancelled && !wasCancelled) {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      // If a cancelled order is reactivated into a non-cancelled status,
      // take the stock back out so inventory stays accurate. Clamp at 0
      // defensively in case stock was manually adjusted in the meantime.
      if (wasCancelled && !isNowCancelled) {
        for (const item of existing.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          const newStock = Math.max(0, (product?.stock ?? 0) - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock }
          });
        }
      }

      return updated;
    });

    res.json(order);

    // Let the customer know their order status changed, in real time,
    // without them having to poll for it.
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { product: { include: { images: true } } }
        }
      }
    });

    if (orderWithItems) {
      const firstItem = orderWithItems.items?.[0];
      emitToUser(orderWithItems.userId, "order:status", {
        orderId: orderWithItems.id,
        status: orderWithItems.status,
        productName: firstItem?.product?.name || "Your order",
        image:
          firstItem?.product?.images?.[0]?.imageUrl ||
          firstItem?.product?.imageUrl ||
          null,
        extraCount: Math.max((orderWithItems.items?.length || 1) - 1, 0)
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true,
        address: true,
        items: {
          include: { product: true }
        },
        coupon: true
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

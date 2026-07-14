const prisma = require("../src/utils/prisma");
const { evaluateCoupon } = require("../src/utils/couponUtils");

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

    const totalAmount = Math.round((subtotalAmount - discountAmount) * 100) / 100;

    // 4. Create order, increment coupon usage, and clear cart atomically
    const order = await prisma.$transaction(async (tx) => {
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

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    res.status(201).json(order);

  } catch (error) {
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

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json(order);
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
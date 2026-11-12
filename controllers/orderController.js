const prisma = require("../src/utils/prisma");
const { ORDERED_PRODUCT_IMAGES } = require("../src/utils/productImages");
const { evaluateCoupon } = require("../src/utils/couponUtils");
const { unitLabel } = require("../src/utils/priceUnit");
const { createAndBroadcastNotification } = require("../src/utils/notify");
const razorpay = require("../src/utils/razorpay");

// Kept in sync with the frontend's ORDER_STATUS_LABELS (src/utils/useNotifications.js)
// so a notification reads the same whether it arrived live or was fetched later.
const ORDER_STATUS_LABELS = {
  PENDING: "placed and is awaiting confirmation",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

// Orders are confirmed automatically, so admins can't move an order back to PENDING.
const ADMIN_SETTABLE_STATUSES = ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

// Customer details safe to send to the admin panel (never the password hash or reset token).
const SAFE_USER_FIELDS = { select: { id: true, name: true, email: true, phone: true } };

const REFUNDED_STATUSES = ["REFUND_PENDING", "REFUNDED"];

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const sendError = (res, error) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, ...error.extra });
  }
  if (error instanceof razorpay.RazorpayError) {
    return res.status(error.status === 503 ? 503 : 502).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};

const formatRupees = amount => `₹${Number(amount || 0).toFixed(2)}`;

// Sends the customer a notification about their order's current status - live if
// they're connected, persisted so it's waiting for them next time if not.
// Runs after the response is sent, so errors are only logged.
async function notifyCustomerOfStatus(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: { include: { images: ORDERED_PRODUCT_IMAGES } } }
        }
      }
    });
    if (!order) return;

    const firstItem = order.items?.[0];
    const statusKey = String(order.status || "").toUpperCase();
    const label = ORDER_STATUS_LABELS[statusKey] || statusKey.toLowerCase();
    const extraCount = Math.max((order.items?.length || 1) - 1, 0);
    const itemsSuffix =
      extraCount > 0 ? ` + ${extraCount} more item${extraCount === 1 ? "" : "s"}` : "";
    const productName = firstItem?.product?.name || "Your order";
    const image =
      firstItem?.product?.images?.[0]?.imageUrl || firstItem?.product?.imageUrl || null;
    const refundNote =
      statusKey === "CANCELLED" && REFUNDED_STATUSES.includes(order.paymentStatus)
        ? ` A refund of ${formatRupees(order.refundAmount)} has been issued to your original payment method.`
        : "";

    createAndBroadcastNotification({
      audience: "USER",
      userId: order.userId,
      type: "order",
      title: `${productName}${itemsSuffix}`,
      message: `Your order has been ${label}.${refundNote}`,
      image,
      link: "/orders",
      socketEvent: "order:status",
      socketPayload: {
        orderId: order.id,
        status: order.status,
        productName,
        image,
        extraCount
      }
    });
  } catch (error) {
    console.error("Failed to send order status notification:", error);
  }
}

// Validates the cart, stock, address and coupon and works out the amounts.
// Throws HttpError for anything the customer needs to fix.
async function prepareCheckout(userId, { addressId, couponCode }) {
  const parsedAddressId = Number(addressId);
  const address = Number.isInteger(parsedAddressId)
    ? await prisma.address.findUnique({ where: { id: parsedAddressId } })
    : null;
  if (!address || address.userId !== userId) {
    throw new HttpError(400, "Please choose a valid delivery address");
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true }
  });
  if (cartItems.length === 0) {
    throw new HttpError(400, "Cart is empty");
  }

  // `quantity` is the number of packs being bought and `stock` the number of packs
  // available (for fixed-price and per-weight products alike), so they compare directly.
  const outOfStockItems = cartItems.filter(item => item.quantity > item.product.stock);
  if (outOfStockItems.length > 0) {
    throw new HttpError(409, "Some items in your cart don't have enough stock", {
      items: outOfStockItems.map(item => ({
        productId: item.productId,
        name: item.product.name,
        requested: item.quantity,
        available: item.product.stock,
        unit: unitLabel(item.product.priceUnit)
      }))
    });
  }

  const subtotalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let coupon = null;
  let discountAmount = 0;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: String(couponCode).trim().toUpperCase() }
    });
    if (!coupon) throw new HttpError(404, "Invalid coupon code");

    const result = await evaluateCoupon({ coupon, userId, subtotalAmount });
    if (!result.valid) throw new HttpError(400, result.message);
    discountAmount = result.discountAmount;
  }

  const totalAmount = Math.round((subtotalAmount - discountAmount) * 100) / 100;

  return { addressId: address.id, cartItems, subtotalAmount, discountAmount, totalAmount, coupon };
}

// Creates the order (always CONFIRMED), reserves stock, uses the coupon and empties
// the cart - all in one transaction.
async function createOrderRecord(userId, checkout, { paymentMethod, paymentStatus, payment }) {
  const { addressId, cartItems, subtotalAmount, discountAmount, totalAmount, coupon } = checkout;

  return prisma.$transaction(async tx => {
    const created = await tx.order.create({
      data: {
        userId,
        addressId,
        subtotalAmount,
        discountAmount,
        totalAmount,
        couponId: coupon ? coupon.id : null,
        couponCode: coupon ? coupon.code : null,
        status: "CONFIRMED",
        paymentMethod,
        paymentStatus,
        razorpayOrderId: payment?.razorpayOrderId || null,
        razorpayPaymentId: payment?.razorpayPaymentId || null,
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

    // The `stock: { gte }` guard protects against two people buying the last pack at
    // the same moment: if stock dropped since the check, abort the whole order.
    for (const item of cartItems) {
      const updateResult = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } }
      });
      if (updateResult.count === 0) {
        throw new HttpError(
          409,
          `"${item.product.name}" no longer has enough stock (only some ${unitLabel(item.product.priceUnit)} left). Please update your cart and try again.`
        );
      }
    }

    await tx.cartItem.deleteMany({ where: { userId } });
    return created;
  });
}

// Notifications sent after an order is placed.
function announceNewOrder(order, user) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const paidWith = order.paymentMethod === "RAZORPAY" ? "paid online" : "cash on delivery";
  createAndBroadcastNotification({
    audience: "ADMIN",
    type: "new_order",
    title: `New order #${order.id}`,
    message: `${user.name || "A customer"} placed an order for ${formatRupees(order.totalAmount)} (${itemCount} item${itemCount === 1 ? "" : "s"}, ${paidWith}). It was confirmed automatically.`,
    link: `/admin/orders/${order.id}`,
    socketEvent: "order:new",
    socketPayload: {
      orderId: order.id,
      customerName: user.name,
      amount: order.totalAmount,
      itemCount
    }
  });
  notifyCustomerOfStatus(order.id);
}

// POST /api/orders - Cash on Delivery. Online payments go through the Razorpay endpoints.
exports.createOrder = async (req, res) => {
  try {
    const paymentMethod = String(req.body.paymentMethod || "COD").toUpperCase();
    if (paymentMethod !== "COD") {
      throw new HttpError(400, "Online payments must be completed through Razorpay checkout");
    }

    const checkout = await prepareCheckout(req.user.id, req.body);
    const order = await createOrderRecord(req.user.id, checkout, {
      paymentMethod: "COD",
      paymentStatus: "UNPAID"
    });

    res.status(201).json(order);
    announceNewOrder(order, req.user);
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/orders/razorpay/create - step 1 of online payment: create a Razorpay
// order for the current cart total. No shop order exists until the payment is verified.
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay.isRazorpayConfigured()) {
      throw new HttpError(503, "Online payment isn't available right now. Please choose Cash on Delivery.");
    }

    const checkout = await prepareCheckout(req.user.id, req.body);
    const amountPaise = razorpay.toPaise(checkout.totalAmount);
    if (amountPaise < 100) {
      throw new HttpError(400, "Online payment needs an order total of at least ₹1");
    }

    const rzpOrder = await razorpay.createRazorpayOrder({
      amountPaise,
      receipt: `u${req.user.id}-${Date.now()}`,
      notes: {
        userId: String(req.user.id),
        addressId: String(checkout.addressId),
        couponCode: checkout.coupon?.code || ""
      }
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      prefill: {
        name: req.user.name || "",
        email: req.user.email || "",
        contact: req.user.phone || ""
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

// Refunds a payment that we took but couldn't turn into an order.
async function refundUnusedPayment(paymentId, amountPaise, reason) {
  try {
    await razorpay.refundPayment(paymentId, amountPaise, { reason });
    return true;
  } catch (error) {
    console.error(`URGENT: automatic refund of Razorpay payment ${paymentId} failed:`, error);
    return false;
  }
}

// POST /api/orders/razorpay/verify - step 2: Razorpay Checkout reports success; verify
// the signature, make sure the money is captured, then create the (confirmed) order.
exports.verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: signature
  } = req.body || {};

  try {
    if (!razorpay.isValidPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)) {
      throw new HttpError(400, "Payment verification failed. If money was deducted it will be refunded automatically by your bank or Razorpay.");
    }

    // Already turned into an order (e.g. the browser retried)? Return that order.
    const existing = await prisma.order.findUnique({ where: { razorpayOrderId } });
    if (existing) {
      if (existing.userId !== req.user.id) throw new HttpError(403, "This payment belongs to another account");
      return res.status(200).json(existing);
    }

    const rzpOrder = await razorpay.fetchRazorpayOrder(razorpayOrderId);
    if (String(rzpOrder.notes?.userId) !== String(req.user.id)) {
      throw new HttpError(403, "This payment belongs to another account");
    }

    let payment = await razorpay.fetchPayment(razorpayPaymentId);
    if (payment.order_id !== razorpayOrderId) {
      throw new HttpError(400, "Payment does not match this order");
    }
    if (payment.status === "authorized") {
      payment = await razorpay.capturePayment(razorpayPaymentId, payment.amount);
    }
    if (payment.status !== "captured") {
      throw new HttpError(402, `Payment was not completed (status: ${payment.status})`);
    }

    // From here on we hold the customer's money: any failure must refund it.
    let order;
    try {
      const checkout = await prepareCheckout(req.user.id, {
        addressId: rzpOrder.notes?.addressId,
        couponCode: rzpOrder.notes?.couponCode || undefined
      });
      if (razorpay.toPaise(checkout.totalAmount) !== payment.amount) {
        throw new HttpError(409, "Your cart changed while you were paying");
      }
      order = await createOrderRecord(req.user.id, checkout, {
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        payment: { razorpayOrderId, razorpayPaymentId }
      });
    } catch (error) {
      // A parallel request already created the order for this payment.
      if (error?.code === "P2002") {
        const raced = await prisma.order.findUnique({ where: { razorpayOrderId } });
        if (raced) return res.status(200).json(raced);
      }
      const refunded = await refundUnusedPayment(
        razorpayPaymentId,
        payment.amount,
        "Order could not be placed"
      );
      const reason = error instanceof HttpError ? error.message : "We couldn't place your order";
      throw new HttpError(
        409,
        refunded
          ? `${reason}. Your payment has been refunded and will reach your account in 5-7 working days.`
          : `${reason}. Please contact support with payment ID ${razorpayPaymentId} for a refund.`
      );
    }

    res.status(201).json(order);
    announceNewOrder(order, req.user);
  } catch (error) {
    sendError(res, error);
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: { include: { product: true } },
        address: true,
        coupon: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (error) {
    sendError(res, error);
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: SAFE_USER_FIELDS,
        address: true,
        items: { include: { product: true } },
        coupon: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/admin/orders/status - cancelling an online-paid order refunds it through
// Razorpay first; if the refund fails the order stays as it was.
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.body.orderId);
    const status = String(req.body.status || "").toUpperCase();

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new HttpError(400, "Invalid order id");
    }
    if (!ADMIN_SETTABLE_STATUSES.includes(status)) {
      throw new HttpError(400, `Status must be one of: ${ADMIN_SETTABLE_STATUSES.join(", ")}`);
    }

    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) throw new HttpError(404, "Order not found");

    const wasCancelled = current.status === "CANCELLED";
    const isNowCancelled = status === "CANCELLED";

    if (wasCancelled && !isNowCancelled && REFUNDED_STATUSES.includes(current.paymentStatus)) {
      throw new HttpError(
        400,
        "This order was refunded, so it can't be reopened. The customer can place a new order."
      );
    }

    // Refund online payments before cancelling.
    let refundData = {};
    if (
      isNowCancelled &&
      !wasCancelled &&
      current.paymentStatus === "PAID" &&
      current.razorpayPaymentId
    ) {
      let refund;
      try {
        refund = await razorpay.refundPayment(
          current.razorpayPaymentId,
          razorpay.toPaise(current.totalAmount),
          { orderId: String(current.id), reason: "Order cancelled by store" }
        );
      } catch (error) {
        throw new HttpError(
          502,
          `Razorpay refund failed: ${error.message}. The order was NOT cancelled. Please try again or refund from the Razorpay dashboard.`
        );
      }
      refundData = {
        paymentStatus: razorpay.refundStatusToPaymentStatus(refund.status),
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundedAt: new Date()
      };
    }

    let order;
    try {
      order = await prisma.$transaction(async tx => {
        const existing = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status, ...refundData }
        });

        // Cancelling puts the stock back (1 order item quantity = 1 pack).
        if (isNowCancelled && !wasCancelled) {
          for (const item of existing.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }

        // Reopening a cancelled order takes the stock out again (never below 0,
        // in case stock was adjusted by hand in the meantime).
        if (wasCancelled && !isNowCancelled) {
          for (const item of existing.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: Math.max(0, (product?.stock ?? 0) - item.quantity) }
            });
          }
        }

        return updated;
      });
    } catch (error) {
      if (refundData.refundId) {
        console.error(
          `URGENT: Razorpay refund ${refundData.refundId} was issued for order #${orderId} but saving the cancellation failed:`,
          error
        );
        throw new HttpError(
          500,
          `The refund (${refundData.refundId}) was issued, but the order could not be updated. Please set it to CANCELLED again.`
        );
      }
      throw error;
    }

    res.json(order);
    notifyCustomerOfStatus(order.id);
  } catch (error) {
    sendError(res, error);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "Invalid order id");
    }

    const include = {
      user: SAFE_USER_FIELDS,
      address: true,
      items: {
        include: { product: { include: { images: ORDERED_PRODUCT_IMAGES } } }
      },
      coupon: true
    };

    let order = await prisma.order.findUnique({ where: { id }, include });
    if (!order) throw new HttpError(404, "Order not found");

    // Refunds take a few days; check whether a pending one has gone through.
    if (order.paymentStatus === "REFUND_PENDING" && order.refundId) {
      try {
        const refund = await razorpay.fetchRefund(order.refundId);
        const paymentStatus = razorpay.refundStatusToPaymentStatus(refund.status);
        if (paymentStatus !== order.paymentStatus) {
          order = await prisma.order.update({ where: { id }, data: { paymentStatus }, include });
        }
      } catch (error) {
        console.error("Could not refresh refund status:", error.message);
      }
    }

    res.json(order);
  } catch (error) {
    sendError(res, error);
  }
};

const prisma = require("./prisma");

const isCouponWithinDateRange = (coupon, now = new Date()) => {
  if (coupon.startDate && now < new Date(coupon.startDate)) return false;
  if (coupon.endDate && now > new Date(coupon.endDate)) return false;
  return true;
};

// Recomputes and validates a coupon against the current subtotal/user.
// Always call this on the server before applying a discount - never trust
// a discount amount sent from the frontend.
exports.evaluateCoupon = async ({ coupon, userId, subtotalAmount }) => {
  if (!coupon || !coupon.isActive) {
    return { valid: false, message: "Coupon is invalid or inactive" };
  }

  if (!isCouponWithinDateRange(coupon)) {
    return { valid: false, message: "Coupon is not active for the current date" };
  }

  if (coupon.minOrderAmount && subtotalAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ${coupon.minOrderAmount} is required to use this coupon`
    };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon usage limit has been reached" };
  }

  if (coupon.type === "NEW_USER") {
    const previousOrderCount = await prisma.order.count({ where: { userId } });
    if (previousOrderCount > 0) {
      return {
        valid: false,
        message: "This coupon is valid only for new users placing their first order"
      };
    }
  }

  if (coupon.usageLimitPerUser) {
    const userUsageCount = await prisma.order.count({
      where: { userId, couponId: coupon.id }
    });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      return {
        valid: false,
        message: "You have already used this coupon the maximum number of times"
      };
    }
  }

  let discountAmount = (subtotalAmount * coupon.discountPercent) / 100;
  if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount;
  }
  if (discountAmount > subtotalAmount) {
    discountAmount = subtotalAmount;
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const totalAmount = Math.round((subtotalAmount - discountAmount) * 100) / 100;

  return {
    valid: true,
    message: "Coupon applied successfully",
    discountPercent: coupon.discountPercent,
    discountAmount,
    subtotalAmount,
    totalAmount
  };
};

// Prisma "where" clause matching coupons that are active today (ignoring
// per-user eligibility, which needs a separate check for NEW_USER coupons).
exports.getActiveCouponWhere = () => {
  const now = new Date();
  return {
    isActive: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] }
    ]
  };
};

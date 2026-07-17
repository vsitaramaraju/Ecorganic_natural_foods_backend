const prisma = require("../src/utils/prisma");
const {
  evaluateCoupon,
  getActiveCouponWhere
} = require("../src/utils/couponUtils");

const VALID_TYPES = ["GENERAL", "NEW_USER", "SEASONAL"];

// ---------- Admin ----------

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountPercent,
      type,
      isActive,
      startDate,
      endDate,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerUser
    } = req.body;

    if (!code || discountPercent === undefined) {
      return res
        .status(400)
        .json({ message: "code and discountPercent are required" });
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      return res
        .status(400)
        .json({ message: "discountPercent must be between 1 and 100" });
    }

    if (type && !VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        description,
        discountPercent,
        type: type || "GENERAL",
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        minOrderAmount: minOrderAmount ?? null,
        maxDiscountAmount: maxDiscountAmount ?? null,
        usageLimit: usageLimit ?? null,
        usageLimitPerUser: usageLimitPerUser ?? 1
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ message: "Failed to fetch coupon" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      code,
      description,
      discountPercent,
      type,
      isActive,
      startDate,
      endDate,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerUser
    } = req.body;

    if (
      discountPercent !== undefined &&
      (discountPercent <= 0 || discountPercent > 100)
    ) {
      return res
        .status(400)
        .json({ message: "discountPercent must be between 1 and 100" });
    }

    if (type && !VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ message: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const data = {};
    if (code !== undefined) data.code = code.trim().toUpperCase();
    if (description !== undefined) data.description = description;
    if (discountPercent !== undefined) data.discountPercent = discountPercent;
    if (type !== undefined) data.type = type;
    if (isActive !== undefined) data.isActive = isActive;
    if (startDate !== undefined)
      data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined)
      data.endDate = endDate ? new Date(endDate) : null;
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined)
      data.maxDiscountAmount = maxDiscountAmount;
    if (usageLimit !== undefined) data.usageLimit = usageLimit;
    if (usageLimitPerUser !== undefined)
      data.usageLimitPerUser = usageLimitPerUser;

    const coupon = await prisma.coupon.update({ where: { id }, data });

    res.json(coupon);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Coupon not found" });
    }
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Coupon not found" });
    }
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

// ---------- User-facing ----------

// Lists active coupons, flagging whether the current user is eligible
// (mainly relevant for NEW_USER coupons).
exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: getActiveCouponWhere(),
      orderBy: { createdAt: "desc" }
    });

    const previousOrderCount = await prisma.order.count({
      where: { userId: req.user.id }
    });

    const result = coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountPercent: coupon.discountPercent,
      type: coupon.type,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      endDate: coupon.endDate,
      eligible: coupon.type === "NEW_USER" ? previousOrderCount === 0 : true
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

// Validates a coupon against the user's current cart and returns a discount
// preview. Does not create an order or mark the coupon as used.
exports.validateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ valid: false, message: "Invalid coupon code" });
    }

    const result = await evaluateCoupon({ coupon, userId, subtotalAmount });

    if (!result.valid) {
      return res.status(400).json(result);
    }

    res.json({ ...result, code: coupon.code });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Failed to validate coupon" });
  }
};

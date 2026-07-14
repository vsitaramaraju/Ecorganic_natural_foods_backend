const express = require("express");
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon
} = require("../controllers/couponController");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, authorizeAdmin, createCoupon);
router.get("/", authenticateToken, authorizeAdmin, getAllCoupons);
router.get("/:id", authenticateToken, authorizeAdmin, getCouponById);
router.put("/:id", authenticateToken, authorizeAdmin, updateCoupon);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteCoupon);

module.exports = router;

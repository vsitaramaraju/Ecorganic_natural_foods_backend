const express = require("express");
const { getActiveCoupons, validateCoupon } = require("../controllers/couponController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/active", authenticateToken, getActiveCoupons);
router.post("/validate", authenticateToken, validateCoupon);

module.exports = router;

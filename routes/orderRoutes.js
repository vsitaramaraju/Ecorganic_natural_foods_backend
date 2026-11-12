const express = require("express");
const {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getUserOrders,
  getPaymentConfig
} = require("../controllers/orderController");

const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Which payment methods checkout can offer (public - no secrets returned)
router.get("/payment-config", getPaymentConfig);
// Cash on Delivery
router.post("/", authenticateToken, createOrder);
// Online payment: create a Razorpay order, then verify the payment to place the order
router.post("/razorpay/create", authenticateToken, createRazorpayOrder);
router.post("/razorpay/verify", authenticateToken, verifyRazorpayPayment);
router.get("/", authenticateToken, getUserOrders);

module.exports = router;

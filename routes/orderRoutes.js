const express = require("express");
const {
  createOrder,
  getUserOrders
} = require("../controllers/orderController");

const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, createOrder);
router.get("/", authenticateToken, getUserOrders);

module.exports = router;
const express = require("express");
const {
  getAllOrders,
  updateOrderStatus,
  getOrderById
} = require("../controllers/orderController");

const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, authorizeAdmin, getAllOrders);
router.get("/:id", authenticateToken, authorizeAdmin, getOrderById);
router.put("/status", authenticateToken, authorizeAdmin, updateOrderStatus);

module.exports = router;
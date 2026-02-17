const express = require("express");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem
} = require("../controllers/cartController");

const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, addToCart);
router.get("/", authenticateToken, getCart);
router.put("/", authenticateToken, updateCartItem);
router.delete("/", authenticateToken, removeCartItem);

module.exports = router;

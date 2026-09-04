const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkWishlistItem,
  clearWishlist
} = require("../controllers/wishlistController");

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Add product to wishlist
router.post("/", addToWishlist);

// Get user's wishlist
router.get("/", getWishlist);

// Check if product is in wishlist
router.get("/check/:productId", checkWishlistItem);

// Remove product from wishlist
router.delete("/:productId", removeFromWishlist);

// Clear entire wishlist
router.delete("/", clearWishlist);

module.exports = router;

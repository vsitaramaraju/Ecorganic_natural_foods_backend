const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const { createProduct, getProductById, getProducts, getProductsByCategory, searchProducts } = require("../controllers/productController");
const {
	getProductReviews,
	createProductReview,
	updateProductReview,
	deleteProductReview,
} = require("../controllers/reviewController");
const router = express.Router();

router.post("/", authenticateToken,authorizeAdmin, createProduct);
router.get("/search", searchProducts);
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", authenticateToken, createProductReview);
router.put("/:productId/reviews", authenticateToken, updateProductReview);
router.delete("/:productId/reviews", authenticateToken, deleteProductReview);
router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

module.exports = router;


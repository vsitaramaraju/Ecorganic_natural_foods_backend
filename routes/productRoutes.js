const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const { createProduct, getProductById, getProducts, getProductsByCategory, searchProducts } = require("../controllers/productController");
const {
	getProductReviews,
	createProductReview,
	updateProductReview,
	deleteProductReview,
} = require("../controllers/reviewController");
const { upload } = require("../src/utils/imageUpload");

const router = express.Router();

// Create product with image uploads - accepts multiple files
router.post("/", authenticateToken, authorizeAdmin, upload.array("images", 10), createProduct);
router.get("/search", searchProducts);
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", authenticateToken, createProductReview);
router.put("/:productId/reviews", authenticateToken, updateProductReview);
router.delete("/:productId/reviews", authenticateToken, deleteProductReview);
router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

module.exports = router;


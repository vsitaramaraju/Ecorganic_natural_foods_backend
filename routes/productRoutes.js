const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const { createProduct, getProductById, getProducts, getProductsByCategory } = require("../controllers/productController");
const router = express.Router();

router.post("/", authenticateToken,authorizeAdmin, createProduct);
router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

module.exports = router;


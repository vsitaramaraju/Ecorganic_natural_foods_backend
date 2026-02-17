const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const { createCategory, createProduct, getProductById, getProducts } = require("../controllers/productController");
const router = express.Router();

router.post("/category", authenticateToken,authorizeAdmin, createCategory);
router.post("/", authenticateToken,authorizeAdmin, createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;


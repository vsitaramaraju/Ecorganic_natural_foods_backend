const express = require("express");
const {
  getAllProductsForAdmin,
  getProductsByCategoryForAdmin,
} = require("../controllers/adminProductController");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, authorizeAdmin, getAllProductsForAdmin);
router.get(
  "/category/:categoryId",
  authenticateToken,
  authorizeAdmin,
  getProductsByCategoryForAdmin
);

module.exports = router;

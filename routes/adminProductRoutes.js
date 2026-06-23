const express = require("express");
const {
  getAllProductsForAdmin,
  getProductsByCategoryForAdmin,
  updateProductForAdmin,
  deleteProductForAdmin,
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
router.put("/:id", authenticateToken, authorizeAdmin, updateProductForAdmin);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteProductForAdmin);

module.exports = router;

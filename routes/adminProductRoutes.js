const express = require("express");
const {
  getAllProductsForAdmin,
  getProductsByCategoryForAdmin,
  updateProductForAdmin,
  deleteProductForAdmin,
} = require("../controllers/adminProductController");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const { upload } = require("../src/utils/imageUpload");

const router = express.Router();

router.get("/", authenticateToken, authorizeAdmin, getAllProductsForAdmin);
router.get(
  "/category/:categoryId",
  authenticateToken,
  authorizeAdmin,
  getProductsByCategoryForAdmin
);
// Handle image uploads - accepts multiple files
router.put(
  "/:id", 
  authenticateToken, 
  authorizeAdmin, 
  upload.array("images", 10), // Max 10 images per product
  updateProductForAdmin
);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteProductForAdmin);

module.exports = router;

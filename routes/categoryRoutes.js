const express = require("express");
const {
  authenticateToken,
  authorizeAdmin
} = require("../middlewares/authMiddleware");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");
const { upload } = require("../src/utils/imageUpload");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
// Create category with image uploads - accepts multiple files
router.post("/", authenticateToken, authorizeAdmin, upload.array("images", 10), createCategory);
// Update category with image uploads
router.put("/:id", authenticateToken, authorizeAdmin, upload.array("images", 10), updateCategory);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteCategory);

module.exports = router;

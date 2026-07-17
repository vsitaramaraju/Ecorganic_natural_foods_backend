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

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticateToken, authorizeAdmin, createCategory);
router.put("/:id", authenticateToken, authorizeAdmin, updateCategory);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteCategory);

module.exports = router;

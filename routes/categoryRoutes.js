const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const {
  createCategory,
  getCategories,
  getCategoryById,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticateToken, authorizeAdmin, createCategory);

module.exports = router;

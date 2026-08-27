const express = require("express");
const {
  getAllUsers,
  updateUser,
  updateUserRole,
  deleteUser
} = require("../controllers/adminUserController");
const {
  authenticateToken,
  authorizeAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes below are admin-only
router.use(authenticateToken, authorizeAdmin);

// Get all users
router.get("/users", getAllUsers);

// Edit a user (name / email / phone / role)
router.put("/users/:id", updateUser);

// Update user role only (kept for backward compatibility with existing callers)
router.put("/users/:id/role", updateUserRole);

// Delete a user
router.delete("/users/:id", deleteUser);

module.exports = router;

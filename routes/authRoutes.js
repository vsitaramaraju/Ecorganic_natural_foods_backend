const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updateProfile,
  changePassword
} = require("../controllers/authController");

const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);

// Add these
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);

module.exports = router;

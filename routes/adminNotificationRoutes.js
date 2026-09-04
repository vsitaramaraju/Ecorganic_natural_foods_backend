const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminNotifications,
  markAdminNotificationsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

// Notifications the signed-in admin hasn't read yet (persisted, so it
// includes anything that happened while every admin was logged out).
router.get("/", getAdminNotifications);

// Mark everything up to now as read (called when the admin bell is opened).
router.post("/read", markAdminNotificationsRead);

module.exports = router;

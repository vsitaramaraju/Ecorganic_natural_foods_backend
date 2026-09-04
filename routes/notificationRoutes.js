const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  getMyNotifications,
  markNotificationsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authenticateToken);

// Notifications the signed-in user hasn't read yet (persisted, so it
// includes anything that happened while they were logged out).
router.get("/", getMyNotifications);

// Mark everything up to now as read (called when the bell is opened).
router.post("/read", markNotificationsRead);

module.exports = router;

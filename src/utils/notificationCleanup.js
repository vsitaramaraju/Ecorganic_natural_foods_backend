const prisma = require("./prisma");

// How long a notification stays in the table before it's cleaned up.
// Configurable via env in case you want a longer/shorter window.
const RETENTION_DAYS = Number(process.env.NOTIFICATION_RETENTION_DAYS || 60);

/**
 * Deletes notifications older than the retention window.
 *
 * Safe to run anytime: a user only ever sees notifications created after
 * their personal "read" cursor (User.notificationsReadAt / createdAt) - so
 * once a row is older than the window, every real user's cursor has long
 * since passed it (nobody stays logged out for 60+ days and still expects
 * to see it waiting for them). Deleting it just reclaims disk space that
 * isn't serving anyone anymore, it doesn't hide anything a real user would
 * otherwise have seen.
 */
async function pruneOldNotifications() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const { count } = await prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } }
    });
    if (count > 0) {
      console.log(
        `[notifications] Pruned ${count} notification(s) older than ${RETENTION_DAYS} days.`
      );
    }
  } catch (error) {
    console.error("[notifications] Failed to prune old notifications:", error);
  }
}

module.exports = { pruneOldNotifications, RETENTION_DAYS };

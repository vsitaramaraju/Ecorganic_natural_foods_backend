const prisma = require("../src/utils/prisma");

/**
 * Returns everything the signed-in customer hasn't "read" yet - their own
 * per-user notifications (order status changes) plus store-wide broadcasts
 * (new product/category/coupon) - since their last read timestamp.
 *
 * This is what makes updates survive being logged out or simply not on the
 * site: the live socket only reaches an open connection, but this list is
 * backed by the database, so it's still there whenever they next log in.
 * Falls back to the account's createdAt if they've never opened the bell,
 * so signup doesn't retroactively surface everything that happened before
 * they existed.
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const since = req.user.notificationsReadAt || req.user.createdAt;

    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: { gt: since },
        OR: [{ audience: "BROADCAST" }, { audience: "USER", userId }]
      },
      orderBy: { createdAt: "desc" },
      take: 40
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      // Only exposed outside production - helps pin down schema/migration
      // issues quickly without having to dig through server logs.
      detail: process.env.NODE_ENV === "production" ? undefined : error.message
    });
  }
};

// Called when the customer opens the notification bell - moves their
// "read" cursor forward so everything up to now is no longer returned above.
exports.markNotificationsRead = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationsReadAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    res.status(500).json({
      error: "Failed to mark notifications read",
      detail: process.env.NODE_ENV === "production" ? undefined : error.message
    });
  }
};

/**
 * Same idea as getMyNotifications, but for the "ADMIN" audience - events
 * that came from the customer side that every admin should know about
 * (right now: new orders). Reuses the same per-user notificationsReadAt
 * cursor on the admin's own account, so each admin has their own
 * independent read state.
 */
exports.getAdminNotifications = async (req, res) => {
  try {
    const since = req.user.notificationsReadAt || req.user.createdAt;

    const notifications = await prisma.notification.findMany({
      where: {
        audience: "ADMIN",
        createdAt: { gt: since }
      },
      orderBy: { createdAt: "desc" },
      take: 40
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      detail: process.env.NODE_ENV === "production" ? undefined : error.message
    });
  }
};

// Called when the admin opens their notification bell.
exports.markAdminNotificationsRead = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationsReadAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking admin notifications read:", error);
    res.status(500).json({
      error: "Failed to mark notifications read",
      detail: process.env.NODE_ENV === "production" ? undefined : error.message
    });
  }
};

const prisma = require("./prisma");
const { emitToCustomers, emitToUser, emitToAdmins } = require("../socket");

/**
 * Persists a notification row (so it survives being offline/logged-out)
 * AND pushes it live over the socket to anyone currently connected.
 *
 * `audience` decides both where it's stored and how it's delivered live:
 * - "BROADCAST" -> every customer (new product/category/active coupon),
 *                   delivered to the "customers" room.
 * - "USER"      -> exactly one account, via `userId` (their own order
 *                   status changed), delivered to that user's own room.
 * - "ADMIN"     -> every admin account (a customer placed a new order),
 *                   delivered to the "admins" room.
 *
 * `socketEvent`/`socketPayload` keep the exact live-delivery shape the
 * frontend's socket listeners already expect, unchanged. This never throws
 * into the caller - callers fire it after they've already responded to the
 * request, so a notification hiccup should never affect the main response.
 */
async function createAndBroadcastNotification({
  audience = "BROADCAST",
  userId = null,
  type,
  title,
  message,
  image = null,
  link = null,
  socketEvent,
  socketPayload
}) {
  try {
    await prisma.notification.create({
      data: { userId, audience, type, title, message, image, link }
    });
  } catch (error) {
    console.error("Failed to persist notification:", error);
  }

  try {
    if (audience === "USER") {
      emitToUser(userId, socketEvent, socketPayload);
    } else if (audience === "ADMIN") {
      emitToAdmins(socketEvent, socketPayload);
    } else {
      emitToCustomers(socketEvent, socketPayload);
    }
  } catch (error) {
    console.error("Failed to emit live notification:", error);
  }
}

module.exports = { createAndBroadcastNotification };

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./utils/prisma");

let io = null;

/**
 * Real-time layer for customer notifications (new products/categories/
 * coupons, and a signed-in user's own order status changes) so the
 * frontend no longer has to poll the REST API on an interval.
 *
 * Rooms:
 *  - `user:<id>`   every authenticated socket joins its own room, used for
 *                   notifications aimed at exactly one account (order status).
 *  - `customers`   every authenticated non-admin socket joins this room,
 *                   used for store-wide announcements (new product/category/
 *                   active coupon). Admins don't join it since they're the
 *                   ones creating that content.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  });

  // Authenticate the socket using the same JWT the REST API already uses.
  // A missing/invalid token still connects (as an anonymous socket) rather
  // than rejecting the handshake outright - it simply won't join any room,
  // so it won't receive anything until the app calls connect with a token
  // (e.g. after login).
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (user) {
        socket.user = { id: user.id, role: user.role };
      }
      next();
    } catch {
      // Expired/invalid token - let it connect anonymously instead of
      // erroring the handshake so the client doesn't hard-fail.
      next();
    }
  });

  io.on("connection", socket => {
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (String(socket.user.role).toUpperCase() !== "ADMIN") {
        socket.join("customers");
      }
    }
  });

  return io;
}

function getIO() {
  return io;
}

// Broadcast to every currently-connected, signed-in customer (non-admin).
function emitToCustomers(event, payload) {
  if (!io) return;
  io.to("customers").emit(event, payload);
}

// Notify exactly one user, e.g. when one of their orders changes status.
function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToCustomers, emitToUser };

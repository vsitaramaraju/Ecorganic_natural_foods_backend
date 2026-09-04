const express = require("express");
const cors = require("cors");
const path = require("path");
const prisma = require("./utils/prisma");
const authRoutes = require("../routes/authRoutes");
const productRoutes = require("../routes/productRoutes");
const categoryRoutes = require("../routes/categoryRoutes");
const cartRoutes = require("../routes/cartRoutes");
const addressRoutes = require("../routes/addressRoutes");
const orderRoutes = require("../routes/orderRoutes");
const adminOrderRoutes = require("../routes/adminOrderRoutes");
const adminProductRoutes = require("../routes/adminProductRoutes");
const wishlistRoutes = require("../routes/wishlistRoutes");
const adminRoutes = require("../routes/adminRoutes");
const couponRoutes = require("../routes/couponRoutes");
const adminCouponRoutes = require("../routes/adminCouponRoutes");
const contactRoutes = require("../routes/contactRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const adminNotificationRoutes = require("../routes/adminNotificationRoutes");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Eco Organic Natural Foods API");
});

app.get("/test-db", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

module.exports = app;

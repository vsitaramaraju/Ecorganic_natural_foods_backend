const express = require("express");
const cors = require("cors");
const path = require("path");
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
const homeBannerRoutes = require("../routes/homeBannerRoutes");
const settingsRoutes = require("../routes/settingsRoutes");

const { allowedOrigins } = require("./utils/allowedOrigins");

const app = express();
app.use(
  cors({
    origin: allowedOrigins(),
    credentials: true
  })
);
// Razorpay webhook: needs the raw body to check the signature, so it is mounted
// before express.json(). No auth/CORS involved - Razorpay's servers call it directly.
app.post(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "*/*", limit: "1mb" }),
  require("../controllers/orderController").razorpayWebhook
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
app.use("/api/home-banner", homeBannerRoutes.publicRouter);
app.use("/api/admin/home-banner", homeBannerRoutes.adminRouter);
app.use("/api/settings", settingsRoutes.publicRouter);
app.use("/api/admin/settings", settingsRoutes.adminRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Eco Organic Natural Foods API");
});

module.exports = app;

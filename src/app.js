const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma');
const authRoutes = require("../routes/authRoutes");
const productRoutes = require("../routes/productRoutes");
const categoryRoutes = require("../routes/categoryRoutes");
const cartRoutes = require("../routes/cartRoutes");
const addressRoutes = require("../routes/addressRoutes");
const orderRoutes = require("../routes/orderRoutes");
const adminOrderRoutes = require("../routes/adminOrderRoutes");
const adminProductRoutes = require("../routes/adminProductRoutes");
const wishlistRoutes = require("../routes/wishlistRoutes");


const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.get('/',(req, res)=>{
res.send("Welcome to Eco Organic Natural Foods API");

});

app.get('/test-db', async (req, res)=>{
const users = await prisma.user.findMany();
res.json(users);
});

module.exports = app;
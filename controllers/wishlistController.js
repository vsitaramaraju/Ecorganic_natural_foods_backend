const prisma = require("../src/utils/prisma");

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) },
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if already in wishlist
        const existingWishlist = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId),
                },
            },
        });

        if (existingWishlist) {
            return res.status(400).json({ error: "Product already in wishlist" });
        }

        // Add to wishlist
        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId,
                productId: parseInt(productId),
            },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });

        res.status(201).json({
            message: "Product added to wishlist",
            data: wishlistItem,
        });
    } catch (error) {
        console.log("Error adding to wishlist:", error);
        res.status(500).json({ error: "Failed to add product to wishlist" });
    }
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: { category: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            count: wishlistItems.length,
            data: wishlistItems,
        });
    } catch (error) {
        console.log("Error fetching wishlist:", error);
        res.status(500).json({ error: "Failed to fetch wishlist" });
    }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        // Check if item exists in wishlist
        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId),
                },
            },
        });

        if (!wishlistItem) {
            return res.status(404).json({ error: "Product not in wishlist" });
        }

        // Remove from wishlist
        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId),
                },
            },
        });

        res.status(200).json({
            message: "Product removed from wishlist",
        });
    } catch (error) {
        console.log("Error removing from wishlist:", error);
        res.status(500).json({ error: "Failed to remove product from wishlist" });
    }
};

// Check if product is in wishlist
exports.checkWishlistItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId),
                },
            },
        });

        res.status(200).json({
            isInWishlist: !!wishlistItem,
        });
    } catch (error) {
        console.log("Error checking wishlist:", error);
        res.status(500).json({ error: "Failed to check wishlist" });
    }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.wishlist.deleteMany({
            where: { userId },
        });

        res.status(200).json({
            message: "Wishlist cleared successfully",
        });
    } catch (error) {
        console.log("Error clearing wishlist:", error);
        res.status(500).json({ error: "Failed to clear wishlist" });
    }
};

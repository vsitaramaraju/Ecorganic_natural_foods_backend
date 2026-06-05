const prisma = require("../src/utils/prisma");

exports.createProduct = async (req, res) => {
    try {

        const { name, description, price, categoryId, imageUrl, stock } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                description,
                price,
                categoryId,
                imageUrl,
                stock,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        console.log("Error creating product:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
        });
        res.status(200).json(products);
    } catch (error) {
        console.log("Error fetching products:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId, 10);

        if (Number.isNaN(categoryId)) {
            return res.status(400).json({ error: "Invalid category id" });
        }

        const products = await prisma.product.findMany({
            where: { categoryId },
            include: { category: true },
        });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products by category" });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true },
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.log("Error fetching product by id:", error);
        res.status(500).json({ error: "Failed to fetch product" });
    }   
};

exports.searchProducts = async (req, res) => {
    try {
        const { query, categoryId, minPrice, maxPrice, inStock } = req.query;

        // Build the where clause
        const where = {};

        // Search by product name or description
        if (query) {
            where.OR = [
                {
                    name: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
            ];
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = parseInt(categoryId, 10);
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) {
                where.price.gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                where.price.lte = parseFloat(maxPrice);
            }
        }

        // Filter by stock availability
        if (inStock === "true") {
            where.stock = { gt: 0 };
        }

        // Fetch products with filters
        const products = await prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            count: products.length,
            products,
        });
    } catch (error) {
        console.log("Error searching products:", error);
        res.status(500).json({ error: "Failed to search products" });
    }
};
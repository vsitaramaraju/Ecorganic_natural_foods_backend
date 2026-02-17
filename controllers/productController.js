const prisma = require("../src/utils/prisma");


exports.createCategory = async (req, res) => {
    try {

        const { name } = req.body;

        const category = await prisma.category.create({data:{name}});
        res.status(201).json(category);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


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
        res.status(500).json({ error: "Failed to create product" });
    }
};


exports.getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
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
        res.status(500).json({ error: "Failed to fetch product" });
    }   
};
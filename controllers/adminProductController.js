const prisma = require("../src/utils/prisma");

exports.getAllProductsForAdmin = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.getProductsByCategoryForAdmin = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const products = await prisma.product.findMany({
      where: { categoryId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
};

const prisma = require("../src/utils/prisma");
const { isValidPriceUnit } = require("../src/utils/priceUnit");

const publicReviewInclude = {
  user: {
    select: {
      id: true,
      name: true
    }
  }
};

const buildReviewSummary = reviews => {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    averageRating: Number((totalRating / totalReviews).toFixed(1)),
    totalReviews
  };
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId, imageUrl, stock, priceUnit } =
      req.body;

    if (priceUnit && !isValidPriceUnit(priceUnit)) {
      return res.status(400).json({
        error:
          'Invalid priceUnit. Must be "fixed" or a weight like "per_200g" / "per_1.5kg"'
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        stock,
        priceUnit: priceUnit || "fixed"
      }
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
      include: { category: true }
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
      include: { category: true }
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          include: publicReviewInclude,
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({
      ...product,
      reviewSummary: buildReviewSummary(product.reviews)
    });
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
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: query,
            mode: "insensitive"
          }
        }
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
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    console.log("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};

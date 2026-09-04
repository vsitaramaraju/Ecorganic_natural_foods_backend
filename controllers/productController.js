const prisma = require("../src/utils/prisma");
const { isValidPriceUnit } = require("../src/utils/priceUnit");
const {
  getImageUrlPath,
  deleteImageFile
} = require("../src/utils/imageUpload");
const { createAndBroadcastNotification } = require("../src/utils/notify");

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
    const { name, description, price, categoryId, stock, priceUnit } = req.body;

    // Debug: Log incoming values and their types
    console.log("=== Product Creation Request ===");
    console.log("Incoming data:");
    console.log(`  name: "${name}" (type: ${typeof name})`);
    console.log(
      `  description: "${description}" (type: ${typeof description})`
    );
    console.log(`  price: "${price}" (type: ${typeof price})`);
    console.log(`  categoryId: "${categoryId}" (type: ${typeof categoryId})`);
    console.log(`  stock: "${stock}" (type: ${typeof stock})`);
    console.log(`  priceUnit: "${priceUnit}" (type: ${typeof priceUnit})`);
    console.log(`  files: ${req.files?.length || 0} image(s)`);

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Product description is required" });
    }

    // Parse and validate price (Float)
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      console.log(`❌ Invalid price: "${price}" → NaN or negative`);
      return res.status(400).json({ error: "Invalid price" });
    }
    console.log(`✓ price: "${price}" → ${parsedPrice} (Float)`);

    // Parse and validate categoryId (Int)
    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      console.log(`❌ Invalid categoryId: "${categoryId}" → NaN`);
      return res.status(400).json({ error: "Invalid category id" });
    }
    console.log(`✓ categoryId: "${categoryId}" → ${parsedCategoryId} (Int)`);

    // Parse and validate stock (Int)
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      console.log(`❌ Invalid stock: "${stock}" → NaN or negative`);
      return res.status(400).json({ error: "Invalid stock" });
    }
    console.log(`✓ stock: "${stock}" → ${parsedStock} (Int)`);

    if (priceUnit && !isValidPriceUnit(priceUnit)) {
      return res.status(400).json({
        error:
          'Invalid priceUnit. Must be "fixed" or a weight like "per_200g" / "per_1.5kg"'
      });
    }

    // Check if images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "At least one product image is required"
      });
    }

    // Get primary image URL from first uploaded file
    const primaryImageUrl = getImageUrlPath(req.files[0].filename);
    console.log(`✓ Primary image: ${primaryImageUrl}`);

    // Create the product first with primary image from first uploaded file
    console.log("Creating product in database...");
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        categoryId: parsedCategoryId,
        imageUrl: primaryImageUrl,
        stock: parsedStock,
        priceUnit: priceUnit || "fixed"
      },
      include: { images: true }
    });
    console.log(`✓ Product created with ID: ${product.id}`);

    // Create ProductImage records for each uploaded file
    const imageUrls = req.files.map(file => getImageUrlPath(file.filename));
    for (const imageUrl of imageUrls) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl
        }
      });
    }

    // Fetch product with all images
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true }
    });

    res.status(201).json(updatedProduct);
    console.log("✓ Product created successfully!");

    // Notify customers - live for whoever's connected, persisted for
    // everyone else so it's waiting for them next time they log in.
    const productImage =
      updatedProduct.images?.[0]?.imageUrl || updatedProduct.imageUrl;
    createAndBroadcastNotification({
      audience: "BROADCAST",
      type: "product",
      title: "New product added",
      message: `"${updatedProduct.name}" just landed in the store.`,
      image: productImage,
      link: `/product/${updatedProduct.id}`,
      socketEvent: "product:new",
      socketPayload: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        image: productImage
      }
    });
  } catch (error) {
    // Delete uploaded files if product creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.path);
      });
    }

    console.error("\n❌ Error creating product:");
    console.error("Message:", error.message);
    if (error.meta?.field_name) {
      console.error("Invalid field:", error.meta.field_name);
    }
    if (error.meta?.argument) {
      console.error("Invalid argument:", error.meta.argument);
    }
    console.error("Full error:", error);

    res.status(500).json({
      error: error.message,
      details: error.meta || null
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true
      }
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
      include: {
        category: true,
        images: true
      }
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
        images: true,
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
      include: {
        category: true,
        images: true
      },
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

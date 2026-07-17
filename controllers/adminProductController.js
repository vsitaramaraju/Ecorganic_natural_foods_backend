const prisma = require("../src/utils/prisma");
const { isValidPriceUnit } = require("../src/utils/priceUnit");

const parseProductId = value => {
  const productId = parseInt(value, 10);

  if (Number.isNaN(productId)) {
    return null;
  }

  return productId;
};

const buildProductUpdateData = body => {
  const data = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }

  if (body.description !== undefined) {
    data.description = body.description;
  }

  if (body.imageUrl !== undefined) {
    data.imageUrl = body.imageUrl;
  }

  if (body.price !== undefined) {
    const price = Number(body.price);

    if (Number.isNaN(price) || price < 0) {
      return { error: "Invalid price" };
    }

    data.price = price;
  }

  if (body.priceUnit !== undefined) {
    if (!isValidPriceUnit(body.priceUnit)) {
      return {
        error:
          'Invalid priceUnit. Must be "fixed" or a weight like "per_200g" / "per_1.5kg"'
      };
    }
    data.priceUnit = body.priceUnit;
  }

  if (body.stock !== undefined) {
    const stock = parseInt(body.stock, 10);

    if (Number.isNaN(stock) || stock < 0) {
      return { error: "Invalid stock" };
    }

    data.stock = stock;
  }

  if (body.categoryId !== undefined) {
    const categoryId = parseInt(body.categoryId, 10);

    if (Number.isNaN(categoryId)) {
      return { error: "Invalid category id" };
    }

    data.categoryId = categoryId;
  }

  return { data };
};

exports.getAllProductsForAdmin = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
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
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
};

exports.updateProductForAdmin = async (req, res) => {
  try {
    const productId = parseProductId(req.params.id);

    if (!productId) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const { data, error } = buildProductUpdateData(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true }
    });

    res.status(200).json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

exports.deleteProductForAdmin = async (req, res) => {
  try {
    const productId = parseProductId(req.params.id);

    if (!productId) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.status(200).json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Product cannot be deleted because it is linked to other records"
      });
    }

    res.status(500).json({ error: "Failed to delete product" });
  }
};

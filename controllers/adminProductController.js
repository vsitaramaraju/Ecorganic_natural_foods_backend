const prisma = require("../src/utils/prisma");
const { ORDERED_PRODUCT_IMAGES } = require("../src/utils/productImages");
const { isValidPriceUnit } = require("../src/utils/priceUnit");
const { getImageUrlPath, deleteImageFile } = require("../src/utils/imageUpload");

// Delete files multer saved for a request that then failed.
const removeUploadedFiles = files => {
  (files || []).forEach(file => deleteImageFile(getImageUrlPath(file.filename)));
};

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

  // Note: imageUrl is not updatable directly - use image upload instead
  // Removed: if (body.imageUrl !== undefined) { data.imageUrl = body.imageUrl; }

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
      include: { 
        category: true,
        images: ORDERED_PRODUCT_IMAGES
      },
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
      include: { 
        category: true,
        images: ORDERED_PRODUCT_IMAGES
      },
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
      removeUploadedFiles(req.files);
      return res.status(400).json({ error: "Invalid product id" });
    }

    const { data, error } = buildProductUpdateData(req.body);

    if (error) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ error });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: ORDERED_PRODUCT_IMAGES }
    });

    if (!existingProduct) {
      removeUploadedFiles(req.files);
      return res.status(404).json({ error: "Product not found" });
    }

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      });

      if (!category) {
        removeUploadedFiles(req.files);
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // Image changes:
    //  - imageOrder (optional): JSON array giving the full display order. Entries are
    //    existing image ids (numbers) or "new-<n>" for the n-th uploaded file.
    //    Existing images left out are deleted; uploads left out go at the end.
    //    The first image is the product's main image.
    //  - without imageOrder, uploads are added after the existing images.
    //  - replaceImages=true (older clients): drop all existing images.
    const uploadedFiles = req.files || [];
    const newUrls = uploadedFiles.map(file => getImageUrlPath(file.filename));
    const byId = new Map(existingProduct.images.map(img => [img.id, img]));

    // Ordered list of { existing } or { newIndex } entries.
    let ordered = existingProduct.images.map(img => ({ existing: img }));
    let imagesChanged = uploadedFiles.length > 0;

    if (req.body.imageOrder !== undefined) {
      let entries;
      try {
        entries = JSON.parse(req.body.imageOrder);
      } catch {
        entries = null;
      }
      const parsed = Array.isArray(entries)
        ? entries.map(entry => {
            if (typeof entry === "number" && byId.has(entry)) {
              return { key: `id-${entry}`, existing: byId.get(entry) };
            }
            const match = typeof entry === "string" && /^new-(\d+)$/.exec(entry);
            const newIndex = match ? Number(match[1]) : -1;
            if (newIndex >= 0 && newIndex < newUrls.length) {
              return { key: entry, newIndex };
            }
            return null;
          })
        : null;

      if (
        !parsed ||
        parsed.includes(null) ||
        new Set(parsed.map(p => p.key)).size !== parsed.length
      ) {
        removeUploadedFiles(uploadedFiles);
        return res.status(400).json({
          error:
            'imageOrder must list this product\'s image ids and/or "new-<n>" upload references, without duplicates'
        });
      }
      ordered = parsed;
      imagesChanged = true;
    } else if (req.body.replaceImages === "true" && uploadedFiles.length > 0) {
      ordered = [];
    }

    // Uploads not placed by imageOrder go at the end.
    const placed = new Set(ordered.filter(o => o.newIndex !== undefined).map(o => o.newIndex));
    newUrls.forEach((_, newIndex) => {
      if (!placed.has(newIndex)) ordered.push({ newIndex });
    });

    if (imagesChanged && ordered.length === 0) {
      return res.status(400).json({ error: "A product needs at least one image" });
    }

    if (Object.keys(data).length === 0 && !imagesChanged) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    let removedImages = [];
    const imageOps = [];
    if (imagesChanged) {
      const keptIds = new Set(ordered.filter(o => o.existing).map(o => o.existing.id));
      removedImages = existingProduct.images.filter(img => !keptIds.has(img.id));

      imageOps.push(
        prisma.productImage.deleteMany({
          where: { id: { in: removedImages.map(img => img.id) } }
        }),
        ...ordered.flatMap((o, position) =>
          o.existing
            ? [prisma.productImage.update({ where: { id: o.existing.id }, data: { position } })]
            : []
        ),
        prisma.productImage.createMany({
          data: ordered.flatMap((o, position) =>
            o.existing ? [] : [{ productId, imageUrl: newUrls[o.newIndex], position }]
          )
        })
      );

      // The product's main image is the first one in display order.
      const first = ordered[0];
      data.imageUrl = first.existing ? first.existing.imageUrl : newUrls[first.newIndex];
    }

    // Image changes and the product update succeed or fail together.
    const results = await prisma.$transaction([
      ...imageOps,
      prisma.product.update({
        where: { id: productId },
        data,
        include: {
          category: true,
          images: ORDERED_PRODUCT_IMAGES
        }
      })
    ]);
    const product = results[results.length - 1];

    removedImages.forEach(img => deleteImageFile(img.imageUrl));

    res.status(200).json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    // Delete uploaded files if update fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.path);
      });
    }

    console.error("Error updating product:", error);
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
      where: { id: productId },
      include: { images: ORDERED_PRODUCT_IMAGES }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete image files from filesystem
    for (const image of existingProduct.images) {
      deleteImageFile(image.imageUrl);
    }

    // Delete product and related images (due to cascade delete)
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

    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

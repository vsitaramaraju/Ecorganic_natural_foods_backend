const prisma = require("../src/utils/prisma");
const {
  getImageUrlPath,
  deleteImageFile
} = require("../src/utils/imageUpload");
const { emitToCustomers } = require("../src/socket");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "At least one category image is required"
      });
    }

    // Get primary image URL from first uploaded file
    const primaryImageUrl = getImageUrlPath(req.files[0].filename);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        imageUrl: primaryImageUrl
      },
      include: { images: true }
    });

    // Create CategoryImage records for each uploaded file
    const imageUrls = req.files.map(file => getImageUrlPath(file.filename));
    for (const imageUrl of imageUrls) {
      await prisma.categoryImage.create({
        data: {
          categoryId: category.id,
          imageUrl
        }
      });
    }

    // Fetch category with all images
    const updatedCategory = await prisma.category.findUnique({
      where: { id: category.id },
      include: { images: true }
    });

    res.status(201).json(updatedCategory);

    // Notify connected customers in real time instead of making them poll.
    emitToCustomers("category:new", {
      id: updatedCategory.id,
      name: updatedCategory.name,
      image: updatedCategory.images?.[0]?.imageUrl || updatedCategory.imageUrl
    });
  } catch (error) {
    // Delete uploaded files if category creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.path);
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }

    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create category" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { images: true },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const { name } = req.body;

    const data = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      data.name = name.trim();
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { images: true }
    });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const shouldReplaceImages = req.body.replaceImages === "true";

      if (shouldReplaceImages) {
        // Delete old image files
        for (const image of existing.images) {
          deleteImageFile(image.imageUrl);
        }
        // Delete old image records
        await prisma.categoryImage.deleteMany({
          where: { categoryId: id }
        });
      }

      // Add new image records
      const imageUrls = req.files.map(file => getImageUrlPath(file.filename));
      for (const imageUrl of imageUrls) {
        await prisma.categoryImage.create({
          data: {
            categoryId: id,
            imageUrl
          }
        });
      }

      // Update category's primary image to first uploaded image
      data.imageUrl = imageUrls[0];
    }

    if (
      Object.keys(data).length === 0 &&
      (!req.files || req.files.length === 0)
    ) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: { images: true }
    });

    res.status(200).json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    // Delete uploaded files if update fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.path);
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }

    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { images: true }
    });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete image files from filesystem
    for (const image of existing.images) {
      deleteImageFile(image.imageUrl);
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    // A category with products still linked to it can't be deleted because
    // Product.categoryId is a required (non-nullable) foreign key.
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "This category still has products in it. Move or delete those products first."
      });
    }
    res.status(500).json({ error: "Failed to delete category" });
  }
};

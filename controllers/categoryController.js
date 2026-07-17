const prisma = require("../src/utils/prisma");

exports.createCategory = async (req, res) => {
  try {
    const { name, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        imageUrl
      }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
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
      where: { id }
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

    const { name, imageUrl } = req.body;

    const data = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      data.name = name.trim();
    }
    if (imageUrl !== undefined) {
      data.imageUrl = imageUrl;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = await prisma.category.update({
      where: { id },
      data
    });

    res.status(200).json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
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

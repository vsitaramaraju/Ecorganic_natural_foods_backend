const prisma = require("../src/utils/prisma");

const USER_ROLES = ["USER", "ADMIN"];

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true
};

const parseUserId = value => {
  const userId = parseInt(value, 10);
  return Number.isNaN(userId) ? null : userId;
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: "desc" }
    });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// PUT /api/admin/users/:id  (edit name / email / phone / role)
exports.updateUser = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone, role } = req.body;
    const data = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      data.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      if (normalizedEmail !== existingUser.email.toLowerCase()) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
        if (emailTaken) {
          return res.status(409).json({ message: "Email is already in use" });
        }
      }
      data.email = normalizedEmail;
    }

    if (phone !== undefined) {
      data.phone = phone ? String(phone).trim() : null;
    }

    if (role !== undefined) {
      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (req.user.id === userId && role !== "ADMIN") {
        return res
          .status(400)
          .json({ message: "You cannot remove your own admin access" });
      }
      data.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email is already in use" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
};

// PUT /api/admin/users/:id/role  (kept for backward compatibility)
exports.updateUserRole = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { role } = req.body;
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === userId && role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "You cannot remove your own admin access" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_SELECT
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === userId) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    // Full account wipe: remove everything tied to this user, including
    // their order history, then the user itself. Order/OrderItem have no
    // cascade delete configured in the schema, so they're removed
    // explicitly and in the right order to satisfy foreign keys.
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { order: { userId } } }),
      prisma.order.deleteMany({ where: { userId } }),
      prisma.cartItem.deleteMany({ where: { userId } }),
      prisma.wishlist.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.address.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

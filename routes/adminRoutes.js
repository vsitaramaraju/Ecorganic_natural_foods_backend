const express = require("express");
const prisma = require("../src/utils/prisma");

const router = express.Router();

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
});

// Update user role
router.put("/users/:id/role", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role
      }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update role"
    });
  }
});

module.exports = router;

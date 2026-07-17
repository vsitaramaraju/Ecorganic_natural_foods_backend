const express = require("express");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress
} = require("../controllers/addressController");

const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, addAddress);
router.get("/", authenticateToken, getAddresses);
router.put("/:id", authenticateToken, updateAddress);
router.delete("/:id", authenticateToken, deleteAddress);

module.exports = router;

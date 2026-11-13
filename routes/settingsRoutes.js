const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");
const {
  getDeliverySettings,
  updateDeliverySettings,
  getThemeSettings,
  updateThemeSettings
} = require("../controllers/settingsController");

// Mounted at /api/settings
const publicRouter = express.Router();
publicRouter.get("/delivery", getDeliverySettings);
publicRouter.get("/theme", getThemeSettings);

// Mounted at /api/admin/settings
const adminRouter = express.Router();
adminRouter.use(authenticateToken, authorizeAdmin);
adminRouter.put("/delivery", updateDeliverySettings);
adminRouter.put("/theme", updateThemeSettings);

module.exports = { publicRouter, adminRouter };

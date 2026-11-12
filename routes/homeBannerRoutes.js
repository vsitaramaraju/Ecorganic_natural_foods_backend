const express = require("express");
const {
  authenticateToken,
  authorizeAdmin
} = require("../middlewares/authMiddleware");
const {
  getHomeBanner,
  updateHomeBanner,
  resetHomeBanner
} = require("../controllers/homeBannerController");
const { upload } = require("../src/utils/imageUpload");

// Turn multer errors (bad file type, file too large) into a 400 JSON response
// instead of Express's default HTML 500 page.
const uploadBannerImage = (req, res, next) => {
  upload.single("image")(req, res, err => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// Mounted at /api/home-banner
const publicRouter = express.Router();
publicRouter.get("/", getHomeBanner);

// Mounted at /api/admin/home-banner
const adminRouter = express.Router();
adminRouter.use(authenticateToken, authorizeAdmin);
adminRouter.put("/", uploadBannerImage, updateHomeBanner);
adminRouter.delete("/", resetHomeBanner);

module.exports = { publicRouter, adminRouter };

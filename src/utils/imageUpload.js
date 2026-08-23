const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + "-" + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  // Primary check: file extension
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    // More helpful error message
    cb(new Error(`Invalid file type. File: ${file.originalname} (${file.mimetype}). Allowed: jpg, jpeg, png, gif, webp`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Helper function to delete a file
const deleteImageFile = (filePath) => {
  try {
    const fullPath = path.join(uploadsDir, filePath.split("uploads/")[1]);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Error deleting file:", error.message);
  }
};

// Helper function to generate image URL path
const getImageUrlPath = (filename) => {
  return `/uploads/${filename}`;
};

module.exports = {
  upload,
  deleteImageFile,
  getImageUrlPath,
  uploadsDir
};

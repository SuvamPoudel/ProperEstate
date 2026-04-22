const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir();
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const fieldname = file.fieldname;
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}_${fieldname}${extension}`);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, videos, and PDFs are allowed."));
  }
};

// Multer configuration
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

module.exports = upload;
const multer = require("multer");

/**
 * Reusable Multer upload middleware
 * @param {string} folderName - Cloudinary folder (we still accept for compatibility)
 * @param {string} type - "images", "documents", or "all"
 */
const upload = (folderName, type = "all") => {
  const storage = multer.memoryStorage(); // <-- IMPORTANT

  const fileFilter = (req, file, cb) => {
    const mimetype = file.mimetype;

    if (type === "images" && !mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }

    if (type === "documents" && !mimetype.includes("pdf") && !mimetype.includes("word")) {
      return cb(new Error("Only PDF/DOC files are allowed"), false);
    }

    cb(null, true);
  };

  const uploader = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });

  return {
    single: (field) => uploader.single(field),
    array: (field, max) => uploader.array(field, max),
  };
};

module.exports = upload;

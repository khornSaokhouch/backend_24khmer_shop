const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Create multer upload middleware
 * @param {string} folderName - folder inside /public
 * @param {string} type - 'images', 'documents', or 'all'
 */
const upload = (folderName, type = "all") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadFolder = path.join(__dirname, "../../public", folderName);

      // Auto-create folder per upload
      if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

      cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${file.fieldname}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (type === "images") {
      const allowedImages = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      if (allowedImages.includes(ext)) return cb(null, true);
      return cb(new Error("Only image files are allowed!"), false);
    }

    if (type === "documents") {
      const allowedDocs = [".pdf", ".doc", ".docx"];
      if (allowedDocs.includes(ext)) return cb(null, true);
      return cb(new Error("Only PDF and Word documents are allowed!"), false);
    }

    // All other types allowed
    cb(null, true);
  };

  return multer({ storage, fileFilter });
};

module.exports = upload;

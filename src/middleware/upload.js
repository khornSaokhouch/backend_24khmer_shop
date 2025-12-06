const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Reusable Multer upload middleware
 * @param {string} folderName - Folder under 'public' to save files
 * @param {string} type - "images", "documents", or "all"
 */
const upload = (folderName, type = "all") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadFolder = path.join(__dirname, "../../public", folderName);

      // Auto-create folder if it doesn't exist
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }

      cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
      // Create unique filename: fieldname-timestamp-originalname
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext)
        .replace(/\s+/g, "-")
        .toLowerCase();
      const name = `${file.fieldname}-${Date.now()}-${baseName}${ext}`;
      cb(null, name);
    },
  });

  // Filter files based on type
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const imageExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const documentExt = [".pdf", ".doc", ".docx"];

    if (type === "images" && !imageExt.includes(ext)) {
      return cb(new Error("Only image files are allowed"), false);
    }

    if (type === "documents" && !documentExt.includes(ext)) {
      return cb(new Error("Only PDF/DOC files are allowed"), false);
    }

    cb(null, true);
  };

  const uploader = multer({ storage, fileFilter });

  return {
    single: (field) => uploader.single(field),
    array: (field, max) => uploader.array(field, max),
  };
};

module.exports = upload;

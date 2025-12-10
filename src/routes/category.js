const express = require("express");
const router = express.Router();
const multer = require("multer"); // <-- missing import
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Create category
router.post(
  "/",
  auth,
  upload("categories", "images").single("category_image"), // match frontend
  categoryController.createCategory
);

// Get all
router.get("/", categoryController.getAllCategories);

// Get by user
router.get("/:user_id", auth, categoryController.getCategoryByUserId);

// Update
router.put(
  "/:id",
  auth,
  upload("categories", "images").single("category_image"), // match frontend
  categoryController.updateCategory
);

// Delete
router.delete("/:id", auth, categoryController.deleteCategory);

// Multer error handler
router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    (err.message && err.message.includes("Only image"))
  ) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;

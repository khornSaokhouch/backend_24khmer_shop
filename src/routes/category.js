const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// ---------------- Routes ----------------

// Create category (only images allowed)
router.post(
  "/",
  auth,
  upload("categories", "images").single("image"),
  categoryController.createCategory
);

// Get all categories
router.get("/", categoryController.getAllCategories);

// Get categories by user ID
router.get("/:user_id", auth, categoryController.getCategoryByUserId);

// Update category (only images allowed)
router.put(
  "/:id",
  auth,
  upload("categories", "images").single("image"),
  categoryController.updateCategory
);

// Delete category
router.delete("/:id", auth, categoryController.deleteCategory);

// ---------------- Error handling for multer ----------------
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

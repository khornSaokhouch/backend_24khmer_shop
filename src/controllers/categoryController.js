const Category = require("../models/Category");
const mongoose = require("mongoose");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// ----------------- Create -----------------
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    let imagePath = null;
    let imageId = null;

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "categories");
      imagePath = result.secure_url;
      imageId = result.public_id;
    }

    const newCategory = await Category.create({
      user_id: req.user._id,
      name,
      image: imagePath,
      image_id: imageId,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(400).json({ message: err.message });
  }
};

// ----------------- Get All -----------------
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate({
      path: "user_id",
      select: "telegram_id first_name last_name username role",
    });

    res.json(categories);
  } catch (err) {
    console.error("getAllCategories error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Get By User ID -----------------
exports.getCategoryByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const categories = await Category.find({ user_id }).populate({
      path: "user_id",
      select: "telegram_id first_name last_name username role",
    });

    res.json(categories);
  } catch (err) {
    console.error("getCategoryByUserId error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Update -----------------
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (category.image_id) {
        await deleteImage(category.image_id);
      }

      const result = await uploadImage(req.file.buffer, "categories");
      category.image = result.secure_url;
      category.image_id = result.public_id;
    }

    if (name) category.name = name;

    await category.save();

    res.json(category);
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Delete -----------------
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Delete image from Cloudinary if exists
    if (category.image_id) {
      await deleteImage(category.image_id);
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: err.message });
  }
};

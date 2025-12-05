const Category = require("../models/Category");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// ----------------- Create -----------------
exports.createCategory = async (req, res) => {
    try {
      const { name } = req.body;
      let imagePath = null;
  
      if (req.file) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const publicUrl = process.env.PUBLIC_URL || "/public";
        imagePath = `${baseUrl}${publicUrl}/categories/${req.file.filename}`;
      }
  
      const newCategory = await Category.create({
        user_id: req.user._id, // logged-in user
        name,
        image: imagePath,
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

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found for this user" });
    }

    res.json(categories);
  } catch (err) {
    console.error("getCategoryByUserId error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
  
      const category = await Category.findById(id);
      if (!category) return res.status(404).json({ message: "Category not found" });
  
      // Handle new image upload
      if (req.file) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const publicUrl = process.env.PUBLIC_URL || "/public";
        const newImagePath = `${baseUrl}${publicUrl}/categories/${req.file.filename}`;
  
        // Remove old image file if exists
        if (category.image) {
          const oldFilePath = path.join(
            __dirname,
            "../../public/categories",
            path.basename(category.image)
          );
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
  
        category.image = newImagePath;
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Remove image file if exists
    if (category.image) {
      const imagePath = path.join(
        __dirname,
        "../../public/categories",
        path.basename(category.image)
      );
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: err.message });
  }
};
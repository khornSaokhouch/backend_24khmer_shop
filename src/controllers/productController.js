const Product = require("../models/Product");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const mongoose = require("mongoose");
const { Types } = require("mongoose");

// --- CREATE PRODUCT ---
exports.createProduct = async (req, res) => {
  try {
    const { name, category_id, stock, price, description } = req.body;

    if (!Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

    // Upload image if file exists
    let imageUrl = null;
    let publicId = null;
    if (req.file?.buffer) {
      const result = await uploadImage(req.file.buffer, "products");
      imageUrl = result.secure_url;
      publicId = result.public_id;
    }

    const product = new Product({
      user_id: req.user._id,
      name,
      category_id: new Types.ObjectId(category_id), 
      stock: Number(stock) || 0,
      price: Number(price),
      description: description || "",
      image_product: imageUrl,
      image_public_id: publicId,
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// --- GET ALL PRODUCTS ---
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category_id", "name")
      .populate("user_id", "telegram_id first_name username");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- GET PRODUCTS BY USER ---
exports.getProductsByUser = async (req, res) => {
  try {
    const userId = req.params.user_id;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    const products = await Product.find({ user_id: userId })
      .populate("category_id", "name")
      .populate("user_id", "telegram_id first_name username");

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- GET PRODUCT BY ID ---
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category_id", "name")
      .populate("user_id", "telegram_id first_name username");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- UPDATE PRODUCT ---
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const { name, category_id, stock, price, description } = req.body;

    product.name = name ?? product.name;
    product.category_id = category_id ? new mongoose.Types.ObjectId(category_id) : product.category_id;
    product.stock = stock ?? product.stock;
    product.price = price ?? product.price;
    product.description = description ?? product.description;

    // Handle new image upload
    if (req.file?.buffer) {
      if (product.image_public_id) await deleteImage(product.image_public_id);
      const result = await uploadImage(req.file.buffer, "products");
      product.image_product = result.secure_url;
      product.image_public_id = result.public_id;
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- DELETE PRODUCT ---
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.user_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (product.image_public_id) await deleteImage(product.image_public_id);

    await product.remove();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

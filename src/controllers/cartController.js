const Cart = require("../models/Cart");
const Product = require("../models/Product");


exports.getCartByUser = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const cart = await Cart.findOne({ user_id: userId })
        .populate({
          path: "items.product_id",
          select: "name price image_product stock",
        });
  
      if (!cart) {
        return res.status(200).json({
          message: "Cart is empty",
          cart: { items: [] },
        });
      }
  
      res.status(200).json({
        cart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

// controllers/cartController.js (Partial Update)

exports.updateCartItem = async (req, res) => {
    try {
      const userId = req.user._id;
      const { product_id, action } = req.body;
  
      // 1️⃣ Allow "delete" action
      if (!["add", "remove", "delete"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
  
      const product = await Product.findById(product_id);
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      let cart = await Cart.findOne({ user_id: userId });
      if (!cart) return res.status(200).json({ message: "Cart is empty" });
  
      const itemIndex = cart.items.findIndex(
        (item) => item.product_id.toString() === product_id
      );
  
      // 🆕 DELETE ENTIRE ITEM
      if (action === "delete") {
        if (itemIndex > -1) {
          cart.items.splice(itemIndex, 1);
        }
      }
      
      // ➕ ADD ITEM
      else if (action === "add") {
        if (itemIndex > -1) {
          if (cart.items[itemIndex].quantity + 1 > product.stock) {
            return res.status(400).json({ message: "Max stock reached" });
          }
          cart.items[itemIndex].quantity += 1;
        } else {
          cart.items.push({
            product_id: product._id,
            quantity: 1,
            price: product.price,
          });
        }
      }
  
      // ➖ REMOVE ONE QUANTITY
      else if (action === "remove") {
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity -= 1;
          if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1);
          }
        }
      }
  
      await cart.save();
      
      // Repopulate to send back full data
      await cart.populate({
        path: "items.product_id",
        select: "name price image_product stock",
      });
  
      res.status(200).json({
        message: "Cart updated",
        cart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
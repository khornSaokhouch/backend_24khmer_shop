const Favorite = require('../models/Favarite'); // fixed typo
const mongoose = require('mongoose');

// Add a favorite (authenticated user)
exports.addFavorite = async (req, res) => {
  try {
    const user_id = req.user._id; // from auth middleware
    const { product_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ message: 'Invalid product_id' });
    }

    // Check if favorite already exists
    let favorite = await Favorite.findOne({ user_id, product_id });
    if (favorite) {
      // Return existing favorite instead of 400
      return res.status(200).json({ message: 'Product already in favorites', favorite });
    }

    // Create new favorite
    favorite = new Favorite({ user_id, product_id });
    await favorite.save();

    res.status(201).json({ message: 'Favorite added successfully', favorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all favorites for the logged-in user
exports.getUserFavorites = async (req, res) => {
  try {
    const user_id = req.user._id; // use authenticated user, no param needed

    const favorites = await Favorite.find({ user_id }).populate('product_id'); // populate product info
    res.status(200).json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove a favorite
exports.removeFavorite = async (req, res) => {
  try {
    const { favorite_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(favorite_id)) {
      return res.status(400).json({ message: 'Invalid favorite_id' });
    }

    await Favorite.findByIdAndDelete(favorite_id);
    res.status(200).json({ message: 'Favorite removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

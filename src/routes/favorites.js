const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

// Add a favorite
router.post('/', auth, favoriteController.addFavorite);

// Get all favorites for the logged-in user
router.get('/', auth, favoriteController.getUserFavorites);

// Remove a favorite
router.delete('/:favorite_id', auth, favoriteController.removeFavorite);

module.exports = router;

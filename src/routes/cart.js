const express = require("express");
const router = express.Router();
const {getCartByUser, updateCartItem } = require("../controllers/cartController");
const auth = require("../middleware/auth");

// Add or remove ONE item
router.get("/", auth, getCartByUser);
router.post("/update-item", auth, updateCartItem);

module.exports = router;


const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const bot = require("../bot/telegram"); // Telegram bot instance
const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); // multer upload

// ---------------- Routes ----------------

// Create seller (only PDF/Word documents allowed)
router.post(
  "/",
  auth,
  upload("documents", "documents").single("document"),
  (req, res) => sellerController.createSeller(req, res, bot)
);

// Get all sellers
router.get("/", auth, sellerController.getAllSellers);

// Get seller by ID
router.get("/:id", auth, sellerController.getSellerById);

module.exports = router;

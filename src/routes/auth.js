const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const bot = require("../bot/telegram"); // import your Telegram bot instance

// ---------------------------
// OTP Login Flow
// ---------------------------

// Send OTP to the user via Telegram
// Pass the bot instance to the controller so it can send messages
router.post("/send-otp", (req, res) => AuthController.sendOtp(req, res, bot));

// Verify the OTP and issue JWT
router.post("/verify-otp", AuthController.verifyOtp);

module.exports = router;

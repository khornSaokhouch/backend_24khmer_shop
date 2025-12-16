const User = require("../models/User");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const otpStore = require("../utils/otpStore");
const { uploadImage } = require("../utils/cloudinary");
const { addTokenToBlacklist } = require("../utils/tokenBlacklist");

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// ------------------------------------
// Handle Telegram /start
// ------------------------------------
const handleStart = async (user, botInstance, chatId) => {
  try {
    const telegramId = user.id.toString();
    
    // Show a "typing..." status for better UX while processing
    await botInstance.sendChatAction(chatId, "typing");

    let existingUser = await User.findOne({ telegram_id: telegramId });
    let imagePath = existingUser?.image || null;

    // Get user's Telegram profile photo
    const photos = await botInstance.getUserProfilePhotos(user.id, { limit: 1 });
    
    // Only fetch/upload photo if user is new or doesn't have an image
    if (photos.total_count > 0 && !imagePath) {
      try {
        const fileId = photos.photos[0][0].file_id;
        const file = await botInstance.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        // Download image as buffer
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        // Upload to Cloudinary
        const result = await uploadImage(buffer, "users", `user_${telegramId}`);
        if (result && result.secure_url) {
          imagePath = result.secure_url;
        }
      } catch (uploadErr) {
        console.error("Image upload failed, skipping...", uploadErr.message);
      }
    }

    // Save or update user
    existingUser = await User.findOneAndUpdate(
      { telegram_id: telegramId },
      {
        telegram_id: telegramId,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        image: imagePath,
        role: existingUser?.role || "user",
      },
      { upsert: true, new: true }
    );

    const fullName = user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name;

    // 🎨 DESIGN UPDATE: Friendly Welcome Message using HTML
    const welcomeMessage = `
<b>🚀 Welcome back, ${fullName}!</b>

Your profile has been successfully synced with our servers. You can now access your dashboard directly from here.

👇 <b>Tap the button below to start:</b>
    `;

    // Send WebApp button with updated text
    await botInstance.sendMessage(chatId, welcomeMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✨ Open Dashboard",
              web_app: {
                url: `${process.env.FRONTEND_URL}/login?telegram_id=${chatId}`
              }
            }
          ]
        ]
      }
    });

    console.log("Saved user profile:", existingUser);

  } catch (error) {
    console.error("handleStart error:", error.message);
    await botInstance.sendMessage(chatId, "⚠️ <b>Oops!</b> Something went wrong while syncing your profile. Please try typing /start again.", { parse_mode: "HTML" });
  }
};


// ------------------------------------
// Send OTP
// ------------------------------------
const sendOtp = async (req, res, botInstance) => {
  try {
    const telegramId = req.body.telegram_id?.toString();
    console.log("sendOtp called for telegramId:", telegramId);

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegram_id is required" });
    }

    const user = await User.findOne({ telegram_id: telegramId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const otp = generateOtp();
    otpStore.set(telegramId, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // 🎨 DESIGN UPDATE: Secure & Copy-friendly OTP Message
    // The <code> tag makes the OTP monospace and clickable (tap to copy) on Telegram
    const otpMessage = `
🔐 <b>Login Verification</b>

Here is your One-Time Password to log in:

<code>${otp}</code>

<i>(Tap the code to copy)</i>

⏳ <b>Valid for:</b> 5 minutes
⚠️ <b>Note:</b> Do not share this code with anyone, including our support team.
    `;

    await botInstance.sendMessage(telegramId, otpMessage, { parse_mode: "HTML" });

    return res.status(200).json({ success: true, message: "OTP sent successfully to Telegram." });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
};

// ------------------------------------
// Verify OTP
// ------------------------------------
const verifyOtp = async (req, res) => {
  try {
    const telegramId = req.body.telegram_id?.toString();
    const otp = req.body.otp;

    if (!telegramId || !otp) {
      return res.status(400).json({ success: false, message: "Both Telegram ID and OTP are required." });
    }

    const record = otpStore.get(telegramId);

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP request found. Please request a new code." });
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(telegramId);
      return res.status(400).json({ success: false, message: "This OTP has expired. Please request a new one." });
    }

    if (record.otp.toString() !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please check the code and try again." });
    }

    const user = await User.findOne({ telegram_id: telegramId });
    const token = jwt.sign(
      { id: user._id, telegram_id: user.telegram_id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    // Clear OTP after success
    otpStore.delete(telegramId);

    return res.status(200).json({ 
      success: true, 
      message: "Login successful!",
      data: user, 
      token 
    });

  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, message: "Authentication failed due to a server error." });
  }
};

const logoutUser = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  // Add token to blacklist
  addTokenToBlacklist(token);

  return res.json({ success: true, message: "You have been logged out successfully." });
};

module.exports = { handleStart, sendOtp, verifyOtp, logoutUser };
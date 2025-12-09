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
    let existingUser = await User.findOne({ telegram_id: telegramId });

    let imagePath = existingUser?.image || null;

    // Get user's Telegram profile photo
    const photos = await botInstance.getUserProfilePhotos(user.id, { limit: 1 });
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const file = await botInstance.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Download image as buffer
      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");

      // Upload to Cloudinary
      const result = await uploadImage(buffer, "users", `user_${telegramId}`);
      if (result && result.secure_url) {
        imagePath = result.secure_url; // store Cloudinary URL
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

    // Send greeting message
    await botInstance.sendMessage(chatId, `👋 Hi ${fullName}! Profile synced.`);

    // Send WebApp button
    await botInstance.sendMessage(chatId, "Open WebApp 👇", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open App",
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
    console.error("handleStart error:", error.message); // log error message
    console.error(error); // full stack trace
    await botInstance.sendMessage(chatId, "⚠️ Something went wrong!");
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = generateOtp();
    otpStore.set(telegramId, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    await botInstance.sendMessage(telegramId, `🔑 Your OTP code is: ${otp} (valid 5 minutes)`);

    return res.status(200).json({ success: true, message: "OTP sent to your Telegram" });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ success: false, message: err.message });
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
      return res.status(400).json({ success: false, message: "telegram_id and otp required" });
    }

    const record = otpStore.get(telegramId);

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP requested" });
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(telegramId);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp.toString() !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const user = await User.findOne({ telegram_id: telegramId });
    const token = jwt.sign(
      { id: user._id, telegram_id: user.telegram_id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    otpStore.delete(telegramId);

    return res.status(200).json({ success: true, data: user, token });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const logoutUser = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // Add token to blacklist
  addTokenToBlacklist(token);

  return res.json({ success: true, message: "Logged out successfully" });
};


module.exports = { handleStart, sendOtp, verifyOtp, logoutUser };

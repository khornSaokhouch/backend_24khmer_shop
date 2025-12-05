const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const otpStore = require("../utils/otpStore");
const crypto = require("crypto");

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// ------------------------------------
// Handle Telegram /start
// ------------------------------------
const handleStart = async (user, botInstance, chatId) => {
  try {
    console.log("handleStart called for user:", user);

    const telegramId = user.id.toString();
    const existingUser = await User.findOne({ telegram_id: telegramId });

    let publicImageUrl = existingUser?.image || null;

    // Save Telegram profile photo
    if (!existingUser || !publicImageUrl) {
      const photos = await botInstance.getUserProfilePhotos(user.id, {
        limit: 1,
      });

      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const file = await botInstance.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

        const publicFolder = path.join(__dirname, "../../public/users");
        if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder, { recursive: true });

        const imageName = `${telegramId}.jpg`;
        fs.writeFileSync(path.join(publicFolder, imageName), response.data);

        // Use backend URL
        const backendUrl = process.env.BACKEND_URL;
        const publicPath = process.env.PUBLIC_URL || "/public";

        publicImageUrl = `${backendUrl}${publicPath}/users/${imageName}`;
      }
    }

    // Save user in DB
    const savedUser = await User.findOneAndUpdate(
      { telegram_id: telegramId },
      {
        telegram_id: telegramId,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        image: publicImageUrl,
        role: existingUser?.role || "user",
      },
      { upsert: true, new: true }
    );

    const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;

    const message = existingUser
      ? `👋 Welcome back, ${fullName}! Your profile is already stored.`
      : `🎉 Hi ${fullName}! Your profile has been saved successfully.`;

    await botInstance.sendMessage(chatId, message);

    // Send WebApp button (Frontend URL)
    await botInstance.sendMessage(chatId, "Open the app to login and order:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open App",
              web_app: {
                url: `${process.env.FRONTEND_URL}/login?telegram_id=${chatId}`,
              },
            },
          ],
        ],
      },
    });

    console.log("WebApp button sent to user:", chatId);
  } catch (error) {
    console.error("handleStart error:", error);
    botInstance.sendMessage(chatId, "⚠️ Something went wrong while storing your profile.");
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

module.exports = { handleStart, sendOtp, verifyOtp };

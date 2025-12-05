const Seller = require("../models/Seller");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ----------------- Get All Sellers -----------------
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().populate("user_id");
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------- Get Seller by ID -----------------
exports.getSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid seller ID" });

    const seller = await Seller.findById(id).populate({
      path: "user_id",
      select: "telegram_id first_name last_name username role",
    });

    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller);
  } catch (err) {
    console.error("getSellerById error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.createSeller = async (req, res, botInstance) => {
    try {
      const user_id = req.user._id; // from auth middleware
  
      // Handle uploaded document path
      let documentPath = null;
      if (req.file) {
        documentPath = path.join(__dirname, "../../public/documents", req.file.filename);
      }
  
      // Check if seller already exists
      const existingSeller = await Seller.findOne({ user_id });
      if (existingSeller) {
        // Delete uploaded file if exists
        if (documentPath && fs.existsSync(documentPath)) {
          fs.unlinkSync(documentPath);
          console.log("Deleted uploaded file because seller already exists:", documentPath);
        }
  
        return res.status(400).json({
          message: "You already have a seller account.",
          seller: existingSeller,
        });
      }
  
      // Create seller
      const newSeller = await Seller.create({
        ...req.body,
        user_id,
        document_path: documentPath
          ? `${process.env.BASE_URL}/documents/${req.file.filename}`
          : null,
      });
  
      // Prepare Telegram message
      const messageText = `
  📢 New Seller Registered:
  Name: ${newSeller.name || "-"}
  Company: ${newSeller.company_name || "-"}
  Email: ${newSeller.email || "-"}
  Phone: ${newSeller.phone_number || "-"}
  Status: ${newSeller.status || "-"}
      `.trim();
  
      const telegramOptions = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Approve", callback_data: `approve_${newSeller._id}` },
              { text: "❌ Reject", callback_data: `reject_${newSeller._id}` },
            ],
          ],
        },
      };
  
      // Send Telegram notification
      if (documentPath && fs.existsSync(documentPath)) {
        await botInstance.sendDocument(process.env.ADMIN_TELEGRAM_ID, documentPath, {
          caption: messageText,
          ...telegramOptions,
        });
      } else {
        await botInstance.sendMessage(process.env.ADMIN_TELEGRAM_ID, messageText, telegramOptions);
      }
  
      res.status(201).json(newSeller);
    } catch (err) {
      console.error("createSeller error:", err);
  
      // Delete uploaded file on error to prevent orphan files
      if (req.file) {
        const filePath = path.join(__dirname, "../../public/documents", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted uploaded file due to error:", filePath);
        }
      }
  
      res.status(400).json({ message: err.message });
    }
  };

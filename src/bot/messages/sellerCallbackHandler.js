const Seller = require("../../models/Seller");
const User = require("../../models/User");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

module.exports = (bot) => {
  bot.on("callback_query", async (callbackQuery) => {
    const messageId = callbackQuery.message.message_id;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (!data) return;

    const [action, sellerId] = data.split("_"); // e.g., "approve_123"

    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) return;

      const seller = await Seller.findById(sellerId);
      if (!seller) return bot.sendMessage(chatId, "Seller not found.");

      const user = await User.findById(seller.user_id);

      if (action === "approve") {
        // ------------------ Approve seller ------------------
        seller.status = "approved";
        await seller.save();

        if (user) {
          user.role = "owner";
          await user.save();

          await bot.sendMessage(
            user.telegram_id,
            `🎉 Congratulations! Your shop "${seller.name}" has been approved. Your role is now OWNER.`
          );
        }

        bot.sendMessage(chatId, `✅ Seller "${seller.name}" approved!`);

        // Document file remains untouched

    } else if (action === "reject") {
        // ------------------ Reject seller ------------------
        if (seller.document_path) {
          try {
            const filename = path.basename(seller.document_path);
            const docPath = path.join(process.cwd(), "public", "documents", filename);
      
            if (fs.existsSync(docPath)) {
              fs.unlinkSync(docPath);
              console.log("Deleted document:", docPath);
            } else {
              console.warn("Document not found:", docPath);
            }
          } catch (err) {
            console.error("Error deleting document:", err);
          }
        }
      
        // Delete seller
        await Seller.findByIdAndDelete(sellerId);
      
        if (user) {
          await bot.sendMessage(
            user.telegram_id,
            `❌ Sorry! Your shop "${seller.name}" has been rejected and removed.`
          );
        }
      
        bot.sendMessage(chatId, `❌ Seller "${seller.name}" rejected and deleted!`);
      }
      

      // ------------------ Edit original admin message ------------------
      // Only edit if the original message has text
      if (callbackQuery.message.text) {
        const editText =
          action === "approve"
            ? `📢 Seller Registration:\nName: ${seller.name}\nCompany: ${seller.company_name || "-"}\nEmail: ${seller.email}\nPhone: ${seller.phone_number || "-"}\nStatus: approved`
            : `❌ Seller "${seller.name}" has been rejected and removed.`;

        bot.editMessageText(editText, { chat_id: chatId, message_id: messageId }).catch((err) => {
          console.error("Failed to edit message:", err);
        });
      }

    } catch (err) {
      console.error("Callback query error:", err);
      bot.sendMessage(chatId, "⚠️ Error processing your request.");
    }
  });
};

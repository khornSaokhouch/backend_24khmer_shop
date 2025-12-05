const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    telegram_id: {
      type: String,
      required: true,
      unique: true,
    },

    first_name: {
      type: String,
      required: false,
    },

    last_name: {
      type: String,
      required: false,
    },

    username: {
      type: String,
      required: false,
    },

    phone_number: {
      type: String,
      required: false,
    },

    image: {
      type: String, // store Telegram profile photo URL
      required: false,
    },

    language_code: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "owner"],
      default: "user", // default role
    },

    // You can add more fields here anytime
    // premium_user: { type: Boolean, default: false },
    // coins: { type: Number, default: 0 },
    // role: { type: String, default: "user" },
  },
  { timestamps: true } // createdAt + updatedAt
);

module.exports = mongoose.model("User", UserSchema);

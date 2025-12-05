const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The user who created this category
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String, // optional image URL
    },
  },
  { timestamps: true } // createdAt and updatedAt
);

module.exports = mongoose.model("Category", CategorySchema);

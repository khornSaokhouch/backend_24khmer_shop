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
      type: String, // Cloudinary URL
    },
    image_id: {
      type: String, // Cloudinary public_id
    },
  },
  { timestamps: true } // createdAt and updatedAt
);

module.exports = mongoose.model("Category", CategorySchema);

const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
    },
    event_image: {
      type: String, // Cloudinary URL
    },
    image_id: {
      type: String, // Cloudinary public_id (for deletion)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);

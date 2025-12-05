const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // only one seller per user
    },
    name: { type: String, required: true },
    company_name: { type: String },
    email: { type: String, required: true },
    country_region: { type: String },
    street_address: { type: String },
    phone_number: { type: String },
    document_path: { type: String }, // store document URL
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", SellerSchema);

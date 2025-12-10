const User = require("../models/User");
const mongoose = require("mongoose");

// List all users
const index = async (req, res) => {
  try {
    const users = await User.find().select("-__v -password");
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single user by ID
const show = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(id).select("-__v -password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a user
const update = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  try {
    const { first_name, last_name, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { first_name, last_name, role },
      { new: true }
    ).select("-__v -password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a user
const destroy = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { index, show, update, destroy };

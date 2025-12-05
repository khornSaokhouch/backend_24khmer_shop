const User = require("../models/User");

// List all users
const index = async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single user by ID
const show = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update a user (e.g., role, name)
const update = async (req, res) => {
  try {
    const { first_name, last_name, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { first_name, last_name, role },
      { new: true }
    ).select("-__v");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a user
const destroy = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { index, show, update, destroy };

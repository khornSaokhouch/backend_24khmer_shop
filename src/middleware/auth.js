const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // Attach user to request
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized: " + err.message });
  }
};

module.exports = auth;

const express = require("express");
const router = express.Router();

// Import individual route modules
const authRoutes = require("./auth");
const userRoutes = require("./user");
const sellerRoutes = require("./seller");
const categoryRoutes = require("./category");
const eventRoutes = require("./event");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/sellers", sellerRoutes);
router.use("/categories", categoryRoutes);
router.use("/events", eventRoutes);

module.exports = router;

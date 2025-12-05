require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/mongo");

// Start Telegram bot
require("./bot/telegram");

const routes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Serve public folder
const publicUrl = process.env.PUBLIC_URL || "/public";
app.use(publicUrl, express.static("public"));

// API routes
app.use("/api", routes);

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Public folder served at ${publicUrl}`);
});

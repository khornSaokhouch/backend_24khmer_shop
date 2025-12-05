require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/mongo");
const bot = require("./bot/telegram"); // Import bot after dotenv

const routes = require("./routes");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Serve public folder
const publicUrl = process.env.PUBLIC_URL || "/public";
app.use(publicUrl, express.static("public"));

// API routes
app.use("/api", routes);

// Telegram webhook route
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

connectDB();

// Start server first
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Public folder served at ${publicUrl}`);

  // Now set webhook after server is running
  bot.setWebHook(`${process.env.BACKEND_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);
});

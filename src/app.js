require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./database/mongo");
const bot = require("./bot/telegram");
const routes = require("./routes");

const app = express();

// ---------------- CORS ----------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ---------------- Body Parser ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- Serve Static Files ----------------
// Serve the 'public' folder at root
// Now URL http://localhost:3000/events/filename.jpg will work
// app.use(express.static(path.join(__dirname, "../public")));


// ---------------- API Routes ----------------
app.use("/api", routes);

// ---------------- Telegram Webhook ----------------
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ---------------- Connect DB ----------------
connectDB();

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);

  // Set Telegram webhook after server is running
  bot.setWebHook(`${process.env.BACKEND_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);
});

const TelegramBot = require("node-telegram-bot-api");
const { handleStart } = require("../controllers/AuthController");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  await handleStart(user, bot, chatId);
});

// Import callback handler
require("./messages/sellerCallbackHandler")(bot);

module.exports = bot;

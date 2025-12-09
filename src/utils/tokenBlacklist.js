// Simple in-memory token blacklist
const blacklistedTokens = new Set();

/**
 * Add a token to the blacklist
 */
const addTokenToBlacklist = (token) => {
  blacklistedTokens.add(token);
};

/**
 * Check if a token is blacklisted
 */
const isTokenBlacklisted = (token) => blacklistedTokens.has(token);

module.exports = { addTokenToBlacklist, isTokenBlacklisted };

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadWarnings() {
  if (!fs.existsSync(DATA_FILE)) return {};
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(data || "{}");
  return parsed.warnings || {};
}

function saveWarnings(data) {
  const parsed = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "{}")
    : {};

  parsed.warnings = data;
  if (!parsed.afk) parsed.afk = {};

  fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8");
}

/**
 * Add a warning for a member in a guild
 * @param {string} guildId
 * @param {string} userId
 * @param {object} warning - { reason, issuerId, issuerName, timestamp }
 */
function addWarning(guildId, userId, warning) {
  const data = loadWarnings();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];
  data[guildId][userId].push(warning);
  saveWarnings(data);
  return data[guildId][userId].length;
}

/**
 * Get all warnings for a member in a guild
 * @param {string} guildId
 * @param {string} userId
 * @returns {Array}
 */
function getWarnings(guildId, userId) {
  const data = loadWarnings();
  return data[guildId]?.[userId] || [];
}

/**
 * Clear all warnings for a member in a guild
 * @param {string} guildId
 * @param {string} userId
 * @returns {number} number of warnings cleared
 */
function clearWarnings(guildId, userId) {
  const data = loadWarnings();
  const count = data[guildId]?.[userId]?.length || 0;
  if (data[guildId]) {
    delete data[guildId][userId];
    saveWarnings(data);
  }
  return count;
}

module.exports = { addWarning, getWarnings, clearWarnings };

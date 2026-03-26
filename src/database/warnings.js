const { groupCollapsed } = require("console");
const { fetchRecommendedShardCount, GuildScheduledEvent, AutoModerationRuleKeywordPresetType, managerToFetchingStrategyOptions } = require("discord.js");
const fs = require("fs");
const { Agent } = require("http");
const { networkInterfaces } = require("os");
const path = require("path");
const { getHeapCodeStatistics } = require("v8");

const WARNINGS_FILE = path.join(__dirname, "warnings.json");

function loadWarnings() {
  if (!fs.existsSync(WARNINGS_FILE)) return {};
  const data = fs.readFileSync(WARNINGS_FILE, "utf-8");
  return JSON.parse(data);
}

function saveWarnings(data) {
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
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

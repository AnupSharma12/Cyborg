const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadAfkData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw || "{}");
  return parsed.afk || {};
}

function saveAfkData(data) {
  const parsed = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "{}")
    : {};

  parsed.afk = data;
  if (!parsed.warnings) parsed.warnings = {};

  fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8");
}

function setAfk(guildId, userId, reason) {
  const data = loadAfkData();
  if (!data[guildId]) data[guildId] = {};

  data[guildId][userId] = {
    reason: reason || "AFK",
    since: Date.now(),
  };

  saveAfkData(data);
  return data[guildId][userId];
}

function getAfk(guildId, userId) {
  const data = loadAfkData();
  return data[guildId]?.[userId] || null;
}

function removeAfk(guildId, userId) {
  const data = loadAfkData();
  const existing = data[guildId]?.[userId] || null;

  if (data[guildId] && data[guildId][userId]) {
    delete data[guildId][userId];

    if (Object.keys(data[guildId]).length === 0) {
      delete data[guildId];
    }

    saveAfkData(data);
  }

  return existing;
}

function getAfkMentions(guildId, userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const data = loadAfkData();
  const guildData = data[guildId] || {};

  return userIds
    .map((id) => ({ id, data: guildData[id] || null }))
    .filter((entry) => entry.data);
}

module.exports = {
  setAfk,
  getAfk,
  removeAfk,
  getAfkMentions,
};

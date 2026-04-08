const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadRoot() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "{}");
}

function saveRoot(root) {
  if (!root.warnings) root.warnings = {};
  if (!root.afk) root.afk = {};
  if (!root.giveaways) root.giveaways = {};
  if (!root.automod) root.automod = {};
  if (!root.invites) root.invites = {};
  if (!root.modlog) root.modlog = {};
  if (!root.prefixes) root.prefixes = {};
  fs.writeFileSync(DATA_FILE, JSON.stringify(root, null, 2), "utf-8");
}

function getGuildPrefix(guildId, fallbackPrefix) {
  const root = loadRoot();
  return root.prefixes?.[guildId] || fallbackPrefix;
}

function setGuildPrefix(guildId, prefix) {
  const root = loadRoot();
  if (!root.prefixes) root.prefixes = {};
  root.prefixes[guildId] = prefix;
  saveRoot(root);
  return prefix;
}

module.exports = {
  getGuildPrefix,
  setGuildPrefix,
};

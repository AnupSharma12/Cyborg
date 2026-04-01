const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

const DEFAULT_SETTINGS = {
  strikes: 5,
  action: "TIMEOUT",
  debug: false,
  wh_channels: [],
  anti_ghostping: false,
  anti_spam: false,
  anti_caps: false,
  anti_repeat: false,
  anti_massmention: 0,
  anti_attachments: false,
  anti_invites: false,
  anti_links: false,
  max_lines: 0,
};

function loadRoot() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "{}");
}

function saveRoot(root) {
  if (!root.warnings) root.warnings = {};
  if (!root.afk) root.afk = {};
  if (!root.giveaways) root.giveaways = {};
  if (!root.automod) root.automod = {};
  fs.writeFileSync(DATA_FILE, JSON.stringify(root, null, 2), "utf-8");
}

function ensureGuildState(root, guildId) {
  if (!root.automod) root.automod = {};
  if (!root.automod[guildId]) {
    root.automod[guildId] = {
      settings: { ...DEFAULT_SETTINGS },
      strikes: {},
    };
  }

  const guildState = root.automod[guildId];
  guildState.settings = { ...DEFAULT_SETTINGS, ...(guildState.settings || {}) };
  if (!guildState.strikes) guildState.strikes = {};
  return guildState;
}

function getAutomodSettings(guildId) {
  const root = loadRoot();
  const guildState = ensureGuildState(root, guildId);
  return { ...guildState.settings };
}

function setAutomodSettings(guildId, nextSettings) {
  const root = loadRoot();
  const guildState = ensureGuildState(root, guildId);
  guildState.settings = { ...guildState.settings, ...nextSettings };
  saveRoot(root);
  return { ...guildState.settings };
}

function getMemberStrikes(guildId, userId) {
  const root = loadRoot();
  const guildState = ensureGuildState(root, guildId);
  return guildState.strikes[userId] || 0;
}

function addMemberStrikes(guildId, userId, amount) {
  const root = loadRoot();
  const guildState = ensureGuildState(root, guildId);
  const current = guildState.strikes[userId] || 0;
  const next = current + amount;
  guildState.strikes[userId] = next;
  saveRoot(root);
  return next;
}

function resetMemberStrikes(guildId, userId) {
  const root = loadRoot();
  const guildState = ensureGuildState(root, guildId);
  guildState.strikes[userId] = 0;
  saveRoot(root);
}

module.exports = {
  DEFAULT_SETTINGS,
  getAutomodSettings,
  setAutomodSettings,
  getMemberStrikes,
  addMemberStrikes,
  resetMemberStrikes,
};

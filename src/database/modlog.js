const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");
const MODLOG_TYPES = ["user", "channel", "roles", "message"];

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
  fs.writeFileSync(DATA_FILE, JSON.stringify(root, null, 2), "utf-8");
}

function getDefaultConfig() {
  return {
    user: null,
    channel: null,
    roles: null,
    message: null,
  };
}

function normalizeGuildConfig(entry) {
  if (!entry) return getDefaultConfig();

  // Backward compatibility with old string format.
  if (typeof entry === "string") {
    return {
      user: entry,
      channel: entry,
      roles: entry,
      message: entry,
    };
  }

  const base = getDefaultConfig();
  for (const type of MODLOG_TYPES) {
    base[type] = entry[type] || null;
  }
  return base;
}

function getModlogConfig(guildId) {
  const root = loadRoot();
  return normalizeGuildConfig(root.modlog?.[guildId]);
}

function getModlogChannelId(guildId, type) {
  const config = getModlogConfig(guildId);
  if (!type) return config;
  return config[type] || null;
}

function setModlogChannelId(guildId, type, channelId) {
  if (!MODLOG_TYPES.includes(type)) {
    throw new Error(`Invalid modlog type: ${type}`);
  }

  const root = loadRoot();
  if (!root.modlog) root.modlog = {};
  const config = normalizeGuildConfig(root.modlog[guildId]);

  config[type] = channelId || null;
  root.modlog[guildId] = config;

  saveRoot(root);
  return root.modlog[guildId] || null;
}

module.exports = {
  MODLOG_TYPES,
  getModlogConfig,
  getModlogChannelId,
  setModlogChannelId,
};

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw || "{}");
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function ensureInviteRoot(data) {
  if (!data.warnings) data.warnings = {};
  if (!data.afk) data.afk = {};
  if (!data.giveaways) data.giveaways = {};
  if (!data.automod) data.automod = {};
  if (!data.invites) {
    data.invites = {
      settings: {},
      members: {},
    };
  }
  if (!data.invites.settings) data.invites.settings = {};
  if (!data.invites.members) data.invites.members = {};
}

function getDefaultMemberInviteData() {
  return {
    tracked: 0,
    added: 0,
    fake: 0,
    left: 0,
    inviter: null,
    code: null,
  };
}

function getDefaultGuildInviteSettings() {
  return {
    tracking: false,
    ranks: [],
  };
}

function getEffectiveInvites(inviteData = {}) {
  return (inviteData.tracked || 0) + (inviteData.added || 0) - (inviteData.fake || 0) - (inviteData.left || 0);
}

function getGuildInviteSettings(guildId) {
  const data = loadData();
  ensureInviteRoot(data);
  if (!data.invites.settings[guildId]) {
    data.invites.settings[guildId] = getDefaultGuildInviteSettings();
    saveData(data);
  }
  return data.invites.settings[guildId];
}

function setGuildInviteSettings(guildId, settingsPatch) {
  const data = loadData();
  ensureInviteRoot(data);
  const current = data.invites.settings[guildId] || getDefaultGuildInviteSettings();
  data.invites.settings[guildId] = { ...current, ...settingsPatch };
  saveData(data);
  return data.invites.settings[guildId];
}

function getGuildMemberInviteData(guildId, userId) {
  const data = loadData();
  ensureInviteRoot(data);
  if (!data.invites.members[guildId]) data.invites.members[guildId] = {};
  if (!data.invites.members[guildId][userId]) {
    data.invites.members[guildId][userId] = getDefaultMemberInviteData();
    saveData(data);
  }
  return data.invites.members[guildId][userId];
}

function setGuildMemberInviteData(guildId, userId, patch) {
  const data = loadData();
  ensureInviteRoot(data);
  if (!data.invites.members[guildId]) data.invites.members[guildId] = {};
  const current = data.invites.members[guildId][userId] || getDefaultMemberInviteData();
  data.invites.members[guildId][userId] = { ...current, ...patch };
  saveData(data);
  return data.invites.members[guildId][userId];
}

function adjustGuildMemberInvites(guildId, userId, deltaPatch) {
  const data = loadData();
  ensureInviteRoot(data);
  if (!data.invites.members[guildId]) data.invites.members[guildId] = {};
  const current = data.invites.members[guildId][userId] || getDefaultMemberInviteData();
  const next = {
    ...current,
    tracked: (current.tracked || 0) + (deltaPatch.tracked || 0),
    added: (current.added || 0) + (deltaPatch.added || 0),
    fake: (current.fake || 0) + (deltaPatch.fake || 0),
    left: (current.left || 0) + (deltaPatch.left || 0),
  };
  data.invites.members[guildId][userId] = next;
  saveData(data);
  return next;
}

function resetGuildMemberInvites(guildId, userId) {
  return setGuildMemberInviteData(guildId, userId, {
    tracked: 0,
    added: 0,
    fake: 0,
    left: 0,
  });
}

module.exports = {
  getDefaultMemberInviteData,
  getDefaultGuildInviteSettings,
  getEffectiveInvites,
  getGuildInviteSettings,
  setGuildInviteSettings,
  getGuildMemberInviteData,
  setGuildMemberInviteData,
  adjustGuildMemberInvites,
  resetGuildMemberInvites,
};

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function loadRoot() {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw || "{}");
}

function saveRoot(root) {
  if (!root.warnings) root.warnings = {};
  if (!root.afk) root.afk = {};
  if (!root.giveaways) root.giveaways = {};
  fs.writeFileSync(DATA_FILE, JSON.stringify(root, null, 2), "utf-8");
}

function getGiveawayMap() {
  const root = loadRoot();
  return root.giveaways || {};
}

function getAllGiveaways() {
  const map = getGiveawayMap();
  return Object.values(map);
}

function saveGiveaway(messageId, giveawayData) {
  const root = loadRoot();
  if (!root.giveaways) root.giveaways = {};
  root.giveaways[messageId] = giveawayData;
  saveRoot(root);
}

function editGiveaway(messageId, giveawayData) {
  const root = loadRoot();
  if (!root.giveaways) root.giveaways = {};
  const existing = root.giveaways[messageId] || {};
  root.giveaways[messageId] = { ...existing, ...giveawayData };
  saveRoot(root);
}

function deleteGiveaway(messageId) {
  const root = loadRoot();
  if (!root.giveaways) root.giveaways = {};
  delete root.giveaways[messageId];
  saveRoot(root);
}

module.exports = {
  getAllGiveaways,
  saveGiveaway,
  editGiveaway,
  deleteGiveaway,
};
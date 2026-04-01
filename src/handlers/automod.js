const EmbedUtils = require("@helpers/EmbedUtils");
const {
  getAutomodSettings,
  addMemberStrikes,
  getMemberStrikes,
  resetMemberStrikes,
} = require("@src/database/automod");

const spamCache = new Map();
const repeatCache = new Map();
const ghostPingCache = new Map();
const SPAM_WINDOW = 5000;
const REPEAT_WINDOW = 10000;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of spamCache.entries()) {
    if (now - value.timestamp > SPAM_WINDOW) spamCache.delete(key);
  }
  for (const [key, value] of repeatCache.entries()) {
    if (now - value.timestamp > REPEAT_WINDOW) repeatCache.delete(key);
  }
}, 60_000);

async function performAutomod(message) {
  if (!message.guild || message.author.bot) return;

  const settings = getAutomodSettings(message.guild.id);
  if (settings.wh_channels.includes(message.channelId)) return;

  if (!settings.debug && shouldIgnoreModeration(message)) return;
  if (!message.channel.permissionsFor(message.guild.members.me)?.has("ManageMessages")) return;

  const hits = [];
  const content = message.content || "";

  if (settings.max_lines > 0) {
    const lineCount = content.split("\n").length;
    if (lineCount > settings.max_lines) hits.push(`Max Lines: ${lineCount}/${settings.max_lines}`);
  }

  if (settings.anti_attachments && message.attachments.size > 0) hits.push("Attachments Found");
  if (settings.anti_links && containsLink(content)) hits.push("Links Found");
  if (settings.anti_invites && containsInvite(content)) hits.push("Discord Invite Found");

  if (settings.anti_caps && isAllCaps(content)) hits.push("Caps Spam");

  if (settings.anti_massmention > 0) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
    if (mentionCount > settings.anti_massmention) {
      hits.push(`Mass Mention: ${mentionCount}/${settings.anti_massmention}`);
    }
  }

  if (settings.anti_spam && detectSpam(message)) hits.push("Spam Detected");
  if (settings.anti_repeat && detectRepeat(message)) hits.push("Repeat Detected");

  if (hits.length === 0) return;

  if (message.deletable) {
    await message.delete().catch(() => {});
  }

  const strikesAdded = hits.length;
  const totalStrikes = addMemberStrikes(message.guild.id, message.author.id, strikesAdded);

  await message.channel
    .send({
      embeds: [
        EmbedUtils.warning(
          `${message.author} message was auto-moderated.\n` +
            `Reason: **${hits.join(", ")}**\n` +
            `Strikes: **${totalStrikes}/${settings.strikes}**`
        ),
      ],
    })
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 8000))
    .catch(() => {});

  if (totalStrikes >= settings.strikes) {
    await applyAutomodAction(message.member, settings.action);
    resetMemberStrikes(message.guild.id, message.author.id);
  }
}

function trackPotentialGhostPing(message) {
  if (!message.guild || message.author.bot) return;
  const mentionIds = [...message.mentions.users.keys(), ...message.mentions.roles.keys()];
  if (!mentionIds.length && !message.mentions.everyone) return;

  ghostPingCache.set(message.id, {
    guildId: message.guild.id,
    channelId: message.channelId,
    authorId: message.author.id,
    mentionsEveryone: message.mentions.everyone,
    mentionIds,
  });
}

async function handleDeletedMessage(message) {
  if (!message.guild) return;
  const settings = getAutomodSettings(message.guild.id);
  if (!settings.anti_ghostping) return;

  const cached = ghostPingCache.get(message.id);
  ghostPingCache.delete(message.id);
  if (!cached) return;

  const mentionText = cached.mentionsEveryone
    ? "@everyone/@here"
    : cached.mentionIds.map((id) => `<@${id}>`).join(", ");

  const strikes = addMemberStrikes(cached.guildId, cached.authorId, 1);
  const channel = message.guild.channels.cache.get(cached.channelId);
  if (channel && channel.isTextBased()) {
    await channel
      .send({
        embeds: [
          EmbedUtils.warning(
            `<@${cached.authorId}> ghost ping detected.\nMentions: ${mentionText || "unknown"}\nStrikes: **${strikes}/${settings.strikes}**`
          ),
        ],
      })
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 8000))
      .catch(() => {});
  }
}

function shouldIgnoreModeration(message) {
  const member = message.member;
  if (!member) return true;
  if (member.permissions.has(["KickMembers", "BanMembers", "ManageGuild", "ManageMessages"])) return true;
  return false;
}

function containsLink(content) {
  return /(https?:\/\/|www\.)\S+/i.test(content);
}

function containsInvite(content) {
  return /(discord\.gg|discord\.com\/invite)\/\S+/i.test(content);
}

function isAllCaps(content) {
  const letters = content.replace(/[^a-z]/gi, "");
  if (letters.length < 8) return false;
  return letters === letters.toUpperCase();
}

function detectSpam(message) {
  const key = `${message.guild.id}:${message.author.id}`;
  const previous = spamCache.get(key);
  const now = Date.now();

  if (!previous) {
    spamCache.set(key, { timestamp: now, count: 1, channelId: message.channelId });
    return false;
  }

  if (now - previous.timestamp > SPAM_WINDOW) {
    spamCache.set(key, { timestamp: now, count: 1, channelId: message.channelId });
    return false;
  }

  previous.count += 1;
  previous.timestamp = now;
  const spam = previous.count >= 5;
  if (spam) {
    spamCache.delete(key);
    return true;
  }
  spamCache.set(key, previous);
  return false;
}

function detectRepeat(message) {
  const normalized = (message.content || "").trim().toLowerCase();
  if (!normalized) return false;

  const key = `${message.guild.id}:${message.author.id}`;
  const previous = repeatCache.get(key);
  const now = Date.now();

  if (!previous || now - previous.timestamp > REPEAT_WINDOW) {
    repeatCache.set(key, { content: normalized, count: 1, timestamp: now });
    return false;
  }

  if (previous.content !== normalized) {
    repeatCache.set(key, { content: normalized, count: 1, timestamp: now });
    return false;
  }

  previous.count += 1;
  previous.timestamp = now;
  const repeat = previous.count >= 3;
  if (repeat) {
    repeatCache.delete(key);
    return true;
  }
  repeatCache.set(key, previous);
  return false;
}

async function applyAutomodAction(member, action) {
  if (!member || !member.moderatable) return;

  const reason = "Automod: Maximum strikes reached";
  const normalized = String(action || "TIMEOUT").toUpperCase();

  if (normalized === "BAN" && member.bannable) {
    await member.ban({ reason }).catch(() => {});
    return;
  }

  if (normalized === "KICK" && member.kickable) {
    await member.kick(reason).catch(() => {});
    return;
  }

  await member.timeout(10 * 60 * 1000, reason).catch(() => {});
}

module.exports = {
  performAutomod,
  trackPotentialGhostPing,
  handleDeletedMessage,
};

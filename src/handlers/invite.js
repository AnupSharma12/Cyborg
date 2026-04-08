const { Collection } = require("discord.js");
const {
  getEffectiveInvites,
  getGuildInviteSettings,
  getGuildMemberInviteData,
  setGuildMemberInviteData,
  adjustGuildMemberInvites,
} = require("@src/database/invites");

const inviteCache = new Collection();

function getInviteCache(guild) {
  return inviteCache.get(guild.id);
}

function resetInviteCache(guildId) {
  inviteCache.delete(guildId);
}

function cacheInvite(invite, isVanity = false) {
  return {
    code: invite.code,
    uses: invite.uses,
    maxUses: invite.maxUses,
    inviterId: isVanity ? "VANITY" : invite.inviter?.id,
  };
}

async function cacheGuildInvites(guild) {
  if (!guild.members.me.permissions.has("ManageGuild")) return new Collection();

  const invites = await guild.invites.fetch().catch(() => new Collection());
  const temp = new Collection();

  invites.forEach((inv) => temp.set(inv.code, cacheInvite(inv)));

  if (guild.vanityURLCode) {
    const vanity = await guild.fetchVanityData().catch(() => null);
    if (vanity?.code) temp.set(vanity.code, cacheInvite(vanity, true));
  }

  inviteCache.set(guild.id, temp);
  return temp;
}

async function checkInviteRewards(guild, inviterId) {
  if (!inviterId || inviterId === "VANITY") return;

  const settings = getGuildInviteSettings(guild.id);
  const ranks = settings.ranks || [];
  if (ranks.length === 0) return;

  const member = await guild.members.fetch(inviterId).catch(() => null);
  if (!member) return;

  const inviteData = getGuildMemberInviteData(guild.id, inviterId);
  const invites = getEffectiveInvites(inviteData);

  for (const rank of ranks) {
    if (!rank?.roleId || typeof rank.invites !== "number") continue;
    if (invites >= rank.invites && !member.roles.cache.has(rank.roleId)) {
      await member.roles.add(rank.roleId).catch(() => null);
    } else if (invites < rank.invites && member.roles.cache.has(rank.roleId)) {
      await member.roles.remove(rank.roleId).catch(() => null);
    }
  }
}

async function trackJoinedMember(member) {
  if (member.user.bot) return null;

  const guild = member.guild;
  const settings = getGuildInviteSettings(guild.id);
  if (!settings.tracking) return null;

  const cached = inviteCache.get(guild.id);
  const latest = await cacheGuildInvites(guild);
  if (!cached) return null;

  const usedInvite = latest.find((inv) => {
    const prev = cached.get(inv.code);
    return prev && inv.uses > prev.uses;
  });

  if (!usedInvite) return null;

  const inviterId = usedInvite.code === guild.vanityURLCode ? "VANITY" : usedInvite.inviterId;

  setGuildMemberInviteData(guild.id, member.id, {
    inviter: inviterId || null,
    code: usedInvite.code || null,
  });

  if (inviterId) {
    adjustGuildMemberInvites(guild.id, inviterId, { tracked: 1 });
    await checkInviteRewards(guild, inviterId);
  }

  return inviterId || null;
}

async function trackLeftMember(guild, user) {
  if (user.bot) return null;

  const settings = getGuildInviteSettings(guild.id);
  if (!settings.tracking) return null;

  const memberData = getGuildMemberInviteData(guild.id, user.id);
  if (!memberData.inviter) return null;

  const inviterId = memberData.inviter;
  adjustGuildMemberInvites(guild.id, inviterId, { left: 1 });
  await checkInviteRewards(guild, inviterId);
  return inviterId;
}

module.exports = {
  getInviteCache,
  resetInviteCache,
  cacheInvite,
  cacheGuildInvites,
  checkInviteRewards,
  trackJoinedMember,
  trackLeftMember,
};

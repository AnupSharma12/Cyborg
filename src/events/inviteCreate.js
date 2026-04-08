const { getInviteCache, cacheInvite } = require("@handlers/invite");

module.exports = async (client, invite) => {
  if (!invite?.guild) return;
  const cached = getInviteCache(invite.guild);
  if (cached) cached.set(invite.code, cacheInvite(invite));
};

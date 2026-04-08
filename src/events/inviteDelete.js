const { getInviteCache } = require("@handlers/invite");

module.exports = async (client, invite) => {
  if (!invite?.guild) return;
  const cached = getInviteCache(invite.guild);
  if (cached?.has(invite.code)) {
    cached.get(invite.code).deletedTimestamp = Date.now();
  }
};

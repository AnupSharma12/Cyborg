const { trackJoinedMember } = require("@handlers/invite");

module.exports = async (client, member) => {
  if (!member?.guild) return;
  await trackJoinedMember(member).catch(() => null);
};

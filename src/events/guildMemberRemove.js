const { trackLeftMember } = require("@handlers/invite");

module.exports = async (client, member) => {
  if (!member?.guild || !member.user) return;
  await trackLeftMember(member.guild, member.user).catch(() => null);
};

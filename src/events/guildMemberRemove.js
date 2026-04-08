const { trackLeftMember } = require("@handlers/invite");
const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, member) => {
  if (!member?.guild || !member.user) return;
  await sendModlog(member.guild, "user", "Member Left", [
    `User: ${member.user}`,
    `Tag: **${member.user.tag}**`,
    `ID: \`${member.user.id}\``,
  ]);
  await trackLeftMember(member.guild, member.user).catch(() => null);
};

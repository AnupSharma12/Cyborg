const { trackJoinedMember } = require("@handlers/invite");
const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, member) => {
  if (!member?.guild) return;
  await sendModlog(member.guild, "user", "Member Joined", [
    `User: ${member.user}`,
    `Tag: **${member.user.tag}**`,
    `ID: \`${member.id}\``,
  ]);
  await trackJoinedMember(member).catch(() => null);
};

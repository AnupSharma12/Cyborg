const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, role) => {
  if (!role?.guild) return;

  await sendModlog(role.guild, "roles", "Role Created", [
    `Role: ${role}`,
    `Name: **${role.name}**`,
    `ID: \`${role.id}\``,
  ]);
};

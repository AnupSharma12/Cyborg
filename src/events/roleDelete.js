const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, role) => {
  if (!role?.guild) return;

  await sendModlog(role.guild, "roles", "Role Deleted", [
    `Name: **${role.name || "unknown"}**`,
    `ID: \`${role.id}\``,
  ]);
};

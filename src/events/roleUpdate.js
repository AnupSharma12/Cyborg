const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, oldRole, newRole) => {
  if (!newRole?.guild) return;

  const changes = [];
  if (oldRole.name !== newRole.name) changes.push(`Name: **${oldRole.name}** -> **${newRole.name}**`);
  if (oldRole.color !== newRole.color) changes.push(`Color: \`${oldRole.color}\` -> \`${newRole.color}\``);

  if (changes.length === 0) return;

  await sendModlog(newRole.guild, "roles", "Role Updated", [
    `Role: ${newRole}`,
    ...changes,
    `ID: \`${newRole.id}\``,
  ]);
};

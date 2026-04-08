const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, oldChannel, newChannel) => {
  if (!newChannel?.guild) return;

  const changes = [];
  if (oldChannel.name !== newChannel.name) changes.push(`Name: **${oldChannel.name}** -> **${newChannel.name}**`);
  if (oldChannel.topic !== newChannel.topic) changes.push(`Topic updated`);

  if (changes.length === 0) return;

  await sendModlog(newChannel.guild, "channel", "Channel Updated", [
    `Channel: ${newChannel}`,
    ...changes,
    `ID: \`${newChannel.id}\``,
  ]);
};

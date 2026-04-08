const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, channel) => {
  if (!channel?.guild) return;

  await sendModlog(channel.guild, "channel", "Channel Created", [
    `Channel: ${channel}`,
    `Name: ${channel.name}`,
    `Type: ${channel.type}`,
    `ID: \`${channel.id}\``,
  ]);
};

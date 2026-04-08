const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, channel) => {
  if (!channel?.guild) return;

  await sendModlog(channel.guild, "channel", "Channel Deleted", [
    `Name: **${channel.name || "unknown"}**`,
    `Type: ${channel.type}`,
    `ID: \`${channel.id}\``,
  ]);
};

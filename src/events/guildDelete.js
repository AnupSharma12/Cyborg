const WebhookLogger = require("@helpers/WebhookLogger");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Guild} guild
 */
module.exports = async (client, guild) => {
  client.logger.log(`Left server: ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`);
  await WebhookLogger.logGuildLeave(guild, client);
};

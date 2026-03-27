const WebhookLogger = require("@helpers/WebhookLogger");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Guild} guild
 */
module.exports = async (client, guild) => {
  client.logger.log(`Joined server: ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`);
  await WebhookLogger.logGuildJoin(guild, client);
};
 
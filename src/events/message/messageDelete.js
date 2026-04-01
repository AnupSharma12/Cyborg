const automodHandler = require("@handlers/automod");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || !message.author || message.author.bot) return;
  await automodHandler.handleDeletedMessage(message);
};

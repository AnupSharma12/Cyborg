const automodHandler = require("@handlers/automod");
const { sendModlog } = require("@helpers/ModlogUtils");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || !message.author || message.author.bot) return;
  await sendModlog(message.guild, "message", "Message Deleted", [
    `Author: ${message.author}`,
    `Channel: ${message.channel}`,
    `Content: ${truncate(message.content || "(empty)")}`,
  ]);
  await automodHandler.handleDeletedMessage(message);
};

function truncate(text) {
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

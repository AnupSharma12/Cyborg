const { sendModlog } = require("@helpers/ModlogUtils");

module.exports = async (client, oldMessage, newMessage) => {
  if (!newMessage?.guild || !newMessage.author || newMessage.author.bot) return;
  if (oldMessage.content === newMessage.content) return;

  await sendModlog(newMessage.guild, "message", "Message Edited", [
    `Author: ${newMessage.author}`,
    `Channel: ${newMessage.channel}`,
    `Before: ${truncate(oldMessage.content || "(empty)")}`,
    `After: ${truncate(newMessage.content || "(empty)")}`,
    `Jump: ${newMessage.url}`,
  ]);
};

function truncate(text) {
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

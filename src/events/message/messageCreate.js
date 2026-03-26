const { commandHandler } = require("@src/handlers");
const { PREFIX_COMMANDS } = require("@root/config");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  if (PREFIX_COMMANDS.ENABLED) {
    const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;

    // Check for bot mentions
    if (message.content.includes(`${client.user.id}`)) {
      message.channel.send(`> My prefix is \`${prefix}\``);
    }

    if (message.content && message.content.startsWith(prefix)) {
      const invoke = message.content
        .replace(prefix, "")
        .split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        commandHandler.handlePrefixCommand(message, cmd, prefix);
      }
    }
  }
};

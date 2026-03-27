const { commandHandler } = require("@src/handlers");
const { PREFIX_COMMANDS } = require("@root/config");
const EmbedUtils = require("@helpers/EmbedUtils");

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
      const guilds = client.guilds.cache.size;
      const embed = EmbedUtils.embed()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
        .setDescription(
          `Hey there! 👋 I'm **${client.user.username}**, a powerful moderation bot.\n\n` +
          `🔹 **Prefix:** \`${prefix}\`\n` +
          `🔹 **Help:** \`${prefix}help\` or \`/help\`\n` +
          `🔹 **Servers:** ${guilds}\n\n` +
          `Use \`${prefix}help [command]\` for detailed info about a command.`
        )
        .setThumbnail(client.user.displayAvatarURL({ size: 128 }));
      message.channel.send({ embeds: [embed] });
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

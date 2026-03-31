const { commandHandler } = require("@src/handlers");
const { PREFIX_COMMANDS, SUPPORT_SERVER } = require("@root/config");
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
      const totalCommands = new Set([
        ...client.commands.map((c) => c.name),
        ...client.slashCommands.map((c) => c.name),
      ]).size;

      const embed = EmbedUtils.embed()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
        .setDescription(
          `Hey there! 👋 I'm **${client.user.username}**, a feature-rich Discord bot.\n\n` +
          `🔹 **Prefix:** \`${prefix}\`\n` +
          `🔹 **Commands:** \`${totalCommands}\`\n` +
          `🔹 **Help:** \`${prefix}help\` or \`/help\`\n` +
          `🔹 **Servers:** \`${guilds}\`\n` +
          (SUPPORT_SERVER ? `🔹 **Support:** [Click Here](${SUPPORT_SERVER})\n` : "") +
          `\nUse the dropdown menu in \`${prefix}help\` to browse all categories!`
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

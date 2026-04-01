const { commandHandler } = require("@src/handlers");
const { PREFIX_COMMANDS, SUPPORT_SERVER } = require("@root/config");
const EmbedUtils = require("@helpers/EmbedUtils");
const { getAfkMentions, removeAfk } = require("@src/database/afk");
const automodHandler = require("@handlers/automod");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const removedAfk = removeAfk(message.guild.id, message.author.id);
  if (removedAfk) {
    await message.reply({
      embeds: [EmbedUtils.success("Welcome back! I removed your AFK status.")],
    }).catch(() => {});
  }

  const mentionedIds = [...new Set(message.mentions.users.map((user) => user.id))]
    .filter((id) => id !== message.author.id);
  const afkMentions = getAfkMentions(message.guild.id, mentionedIds);

  if (afkMentions.length > 0) {
    const lines = afkMentions.slice(0, 5).map((entry) => {
      const relative = `<t:${Math.floor(entry.data.since / 1000)}:R>`;
      return `<@${entry.id}> is AFK (${relative})\nReason: **${entry.data.reason}**`;
    });

    await message.reply({
      embeds: [EmbedUtils.warning(lines.join("\n\n"))],
    }).catch(() => {});
  }

  const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;

  // Track possible ghost pings for delete-event checks.
  automodHandler.trackPotentialGhostPing(message);

  const isPotentialPrefix = PREFIX_COMMANDS.ENABLED && message.content && message.content.startsWith(prefix);
  if (!isPotentialPrefix) {
    await automodHandler.performAutomod(message);
  }

  if (PREFIX_COMMANDS.ENABLED) {

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

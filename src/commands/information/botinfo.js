const { version: djsVersion } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { SUPPORT_SERVER, PREFIX_COMMANDS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "botinfo",
  description: "Shows information about the bot",
  category: "INFORMATION",
  command: {
    enabled: true,
    aliases: ["bot", "about"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message) {
    const embed = buildEmbed(message.client);
    await message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const embed = buildEmbed(interaction.client);
    await interaction.followUp({ embeds: [embed] });
  },
};

function buildEmbed(client) {
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
  const channels = client.channels.cache.size;
  const uptimeSeconds = Math.floor(client.uptime / 1000);

  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;

  const totalCommands = new Set([
    ...client.commands.map((c) => c.name),
    ...client.slashCommands.map((c) => c.name),
  ]).size;

  const embed = EmbedUtils.embed()
    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Developer", value: "`Anup Sharma`", inline: true },
      { name: "Version", value: "`1.0.0`", inline: true },
      { name: "Uptime", value: `\`${uptime}\``, inline: true },
      { name: "Servers", value: `\`${guilds}\``, inline: true },
      { name: "Users", value: `\`${users.toLocaleString()}\``, inline: true },
      { name: "Channels", value: `\`${channels}\``, inline: true },
      { name: "Commands", value: `\`${totalCommands}\``, inline: true },
      { name: "Prefix", value: `\`${prefix}\``, inline: true },
      { name: "Memory", value: `\`${memUsed} MB\``, inline: true },
      { name: "Node.js", value: `\`${process.version}\``, inline: true },
      { name: "Discord.js", value: `\`v${djsVersion}\``, inline: true },
      { name: "Links", value: SUPPORT_SERVER ? `[Support Server](${SUPPORT_SERVER})` : "None", inline: true },
    )
    .setFooter({ text: `Made with ❤️ by Anup Sharma` });

  return embed;
}

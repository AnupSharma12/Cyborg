const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { getAutomodSettings, setAutomodSettings } = require("@src/database/automod");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "automod",
  description: "Main automod configuration",
  category: "AUTOMOD",
  cooldown: 3,
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<status|strikes|action|debug|whitelist|whitelistadd|whitelistremove>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      { name: "status", description: "Show automod configuration", type: ApplicationCommandOptionType.Subcommand },
      {
        name: "strikes",
        description: "Set max strikes before action",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Number of strikes (>=1)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "action",
        description: "Action when max strikes are reached",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "value",
            description: "TIMEOUT, KICK or BAN",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "TIMEOUT", value: "TIMEOUT" },
              { name: "KICK", value: "KICK" },
              { name: "BAN", value: "BAN" },
            ],
          },
        ],
      },
      {
        name: "debug",
        description: "Moderate admins/moderators too",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "on/off",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "ON", value: "ON" },
              { name: "OFF", value: "OFF" },
            ],
          },
        ],
      },
      { name: "whitelist", description: "Show whitelist channels", type: ApplicationCommandOptionType.Subcommand },
      {
        name: "whitelistadd",
        description: "Add a channel to whitelist",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Text channel",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "whitelistremove",
        description: "Remove a channel from whitelist",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Text channel",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const guildId = message.guild.id;
    const sub = (args[0] || "").toLowerCase();
    const settings = getAutomodSettings(guildId);

    if (sub === "status") return message.reply({ embeds: [buildStatusEmbed(settings, message.guild)] });

    if (sub === "strikes") {
      const strikes = parseInt(args[1], 10);
      if (!Number.isInteger(strikes) || strikes < 1) {
        return message.reply({ embeds: [EmbedUtils.error("Strikes must be a number greater than 0.")] });
      }
      setAutomodSettings(guildId, { strikes });
      return message.reply({ embeds: [EmbedUtils.success(`Max strikes set to ${strikes}`)] });
    }

    if (sub === "action") {
      const action = String(args[1] || "").toUpperCase();
      if (!["TIMEOUT", "KICK", "BAN"].includes(action)) {
        return message.reply({ embeds: [EmbedUtils.error("Action must be TIMEOUT, KICK, or BAN.")] });
      }
      setAutomodSettings(guildId, { action });
      return message.reply({ embeds: [EmbedUtils.success(`Automod action set to ${action}`)] });
    }

    if (sub === "debug") {
      const status = String(args[1] || "").toLowerCase();
      if (!["on", "off"].includes(status)) {
        return message.reply({ embeds: [EmbedUtils.error("Debug value must be on/off.")] });
      }
      setAutomodSettings(guildId, { debug: status === "on" });
      return message.reply({ embeds: [EmbedUtils.success(`Automod debug ${status === "on" ? "enabled" : "disabled"}`)] });
    }

    if (sub === "whitelist") {
      if (!settings.wh_channels.length) return message.reply({ embeds: [EmbedUtils.warning("No channels are whitelisted.")] });
      return message.reply({
        embeds: [
          EmbedUtils.embed()
            .setTitle("Automod Whitelist")
            .setDescription(settings.wh_channels.map((id) => `<#${id}>`).join("\n")),
        ],
      });
    }

    if (sub === "whitelistadd" || sub === "whitelistremove") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) return message.reply({ embeds: [EmbedUtils.error("Please provide a valid text channel.")] });

      const set = new Set(settings.wh_channels);
      if (sub === "whitelistadd") set.add(channel.id);
      else set.delete(channel.id);
      setAutomodSettings(guildId, { wh_channels: [...set] });

      return message.reply({
        embeds: [EmbedUtils.success(sub === "whitelistadd" ? "Channel added to automod whitelist." : "Channel removed from automod whitelist.")],
      });
    }

    return message.reply({ embeds: [EmbedUtils.error("Invalid subcommand.")] });
  },

  async interactionRun(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const settings = getAutomodSettings(guildId);

    if (sub === "status") return interaction.followUp({ embeds: [buildStatusEmbed(settings, interaction.guild)] });

    if (sub === "strikes") {
      const strikes = interaction.options.getInteger("amount", true);
      setAutomodSettings(guildId, { strikes });
      return interaction.followUp({ embeds: [EmbedUtils.success(`Max strikes set to ${strikes}`)] });
    }

    if (sub === "action") {
      const action = interaction.options.getString("value", true);
      setAutomodSettings(guildId, { action });
      return interaction.followUp({ embeds: [EmbedUtils.success(`Automod action set to ${action}`)] });
    }

    if (sub === "debug") {
      const status = interaction.options.getString("status", true).toUpperCase() === "ON";
      setAutomodSettings(guildId, { debug: status });
      return interaction.followUp({ embeds: [EmbedUtils.success(`Automod debug ${status ? "enabled" : "disabled"}`)] });
    }

    if (sub === "whitelist") {
      if (!settings.wh_channels.length) return interaction.followUp({ embeds: [EmbedUtils.warning("No channels are whitelisted.")] });
      return interaction.followUp({
        embeds: [
          EmbedUtils.embed()
            .setTitle("Automod Whitelist")
            .setDescription(settings.wh_channels.map((id) => `<#${id}>`).join("\n")),
        ],
      });
    }

    if (sub === "whitelistadd" || sub === "whitelistremove") {
      const channel = interaction.options.getChannel("channel", true);
      const set = new Set(settings.wh_channels);
      if (sub === "whitelistadd") set.add(channel.id);
      else set.delete(channel.id);
      setAutomodSettings(guildId, { wh_channels: [...set] });
      return interaction.followUp({
        embeds: [EmbedUtils.success(sub === "whitelistadd" ? "Channel added to automod whitelist." : "Channel removed from automod whitelist.")],
      });
    }

    return interaction.followUp({ embeds: [EmbedUtils.error("Invalid subcommand.")] });
  },
};

function buildStatusEmbed(settings, guild) {
  return EmbedUtils.embed()
    .setAuthor({ name: "Automod Configuration", iconURL: guild.iconURL() || undefined })
    .setDescription(
      `**Anti-Spam:** ${settings.anti_spam ? "ON" : "OFF"}\n` +
        `**Anti-Ghostping:** ${settings.anti_ghostping ? "ON" : "OFF"}\n` +
        `**Anti-Caps:** ${settings.anti_caps ? "ON" : "OFF"}\n` +
        `**Anti-Repeat:** ${settings.anti_repeat ? "ON" : "OFF"}\n` +
        `**Anti-MassMention:** ${settings.anti_massmention > 0 ? `ON (>${settings.anti_massmention})` : "OFF"}\n` +
        `**AutoDelete Links:** ${settings.anti_links ? "ON" : "OFF"}\n` +
        `**AutoDelete Invites:** ${settings.anti_invites ? "ON" : "OFF"}\n` +
        `**AutoDelete Attachments:** ${settings.anti_attachments ? "ON" : "OFF"}\n` +
        `**Max Lines:** ${settings.max_lines || 0}\n\n` +
        `**Strikes:** ${settings.strikes}\n` +
        `**Action:** ${settings.action}\n` +
        `**Debug:** ${settings.debug ? "ON" : "OFF"}`
    );
}

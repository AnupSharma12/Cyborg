const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { getAutomodSettings, setAutomodSettings } = require("@src/database/automod");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autodelete",
  description: "Auto-delete messages with attachments, invites, links, or too many lines",
  category: "AUTOMOD",
  cooldown: 3,
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<attachments|invites|links|maxlines> <on|off|number>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      { name: "attachments", description: "Toggle auto-delete for attachments", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      { name: "invites", description: "Toggle auto-delete for invites", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      { name: "links", description: "Toggle auto-delete for links", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      {
        name: "maxlines",
        description: "Set max message lines before auto-delete (0 to disable)",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Maximum lines",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = String(args[0] || "").toLowerCase();
    const guildId = message.guild.id;

    if (sub === "maxlines") {
      const amount = Number.parseInt(args[1], 10);
      if (!Number.isInteger(amount) || amount < 0) {
        return message.reply({ embeds: [EmbedUtils.error("Max lines must be 0 or a positive number.")] });
      }
      setAutomodSettings(guildId, { max_lines: amount });
      return message.reply({
        embeds: [
          EmbedUtils.success(
            amount === 0
              ? "Max lines auto-delete disabled."
              : `Messages longer than ${amount} lines will be auto-deleted.`
          ),
        ],
      });
    }

    const status = String(args[1] || "").toLowerCase();
    if (!["on", "off"].includes(status)) {
      return message.reply({ embeds: [EmbedUtils.error("Status must be on/off.")] });
    }

    const enabled = status === "on";
    const update = getSubUpdate(sub, enabled);
    if (!update) return message.reply({ embeds: [EmbedUtils.error("Invalid autodelete subcommand.")] });

    setAutomodSettings(guildId, update.update);
    return message.reply({ embeds: [EmbedUtils.success(update.message)] });
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "maxlines") {
      const amount = interaction.options.getInteger("amount", true);
      if (amount < 0) return interaction.followUp({ embeds: [EmbedUtils.error("Max lines must be >= 0.")] });
      setAutomodSettings(guildId, { max_lines: amount });
      return interaction.followUp({
        embeds: [
          EmbedUtils.success(
            amount === 0
              ? "Max lines auto-delete disabled."
              : `Messages longer than ${amount} lines will be auto-deleted.`
          ),
        ],
      });
    }

    const enabled = interaction.options.getString("status", true) === "ON";
    const update = getSubUpdate(sub, enabled);
    if (!update) return interaction.followUp({ embeds: [EmbedUtils.error("Invalid autodelete subcommand.")] });

    setAutomodSettings(guildId, update.update);
    return interaction.followUp({ embeds: [EmbedUtils.success(update.message)] });
  },
};

function statusOption() {
  return {
    name: "status",
    description: "on/off",
    type: ApplicationCommandOptionType.String,
    required: true,
    choices: [
      { name: "ON", value: "ON" },
      { name: "OFF", value: "OFF" },
    ],
  };
}

function getSubUpdate(sub, enabled) {
  if (sub === "attachments") {
    return {
      update: { anti_attachments: enabled },
      message: `Auto-delete for attachments is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "invites") {
    return {
      update: { anti_invites: enabled },
      message: `Auto-delete for invites is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "links") {
    return {
      update: { anti_links: enabled },
      message: `Auto-delete for links is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  return null;
}

const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { getAutomodSettings, setAutomodSettings } = require("@src/database/automod");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "anti",
  description: "Anti spam, ghostping, caps and repeat detection settings",
  category: "AUTOMOD",
  cooldown: 3,
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<ghostping|spam|caps|repeat|massmention> <on|off> [threshold]",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      { name: "ghostping", description: "Toggle anti ghostping", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      { name: "spam", description: "Toggle anti spam", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      { name: "caps", description: "Toggle anti caps", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      { name: "repeat", description: "Toggle anti repeat", type: ApplicationCommandOptionType.Subcommand, options: [statusOption()] },
      {
        name: "massmention",
        description: "Toggle anti massmention",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          statusOption(),
          {
            name: "threshold",
            description: "Allowed mentions before trigger (default 3)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = String(args[0] || "").toLowerCase();
    const status = String(args[1] || "").toLowerCase();
    if (!["on", "off"].includes(status)) {
      return message.reply({ embeds: [EmbedUtils.error("Status must be on/off.")] });
    }

    const guildId = message.guild.id;
    const enabled = status === "on";
    const settings = getAutomodSettings(guildId);

    const response = applySetting(sub, enabled, args[2], settings);
    if (response.error) return message.reply({ embeds: [EmbedUtils.error(response.error)] });

    setAutomodSettings(guildId, response.update);
    return message.reply({ embeds: [EmbedUtils.success(response.message)] });
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const status = interaction.options.getString("status", true) === "ON";
    const threshold = interaction.options.getInteger("threshold");
    const guildId = interaction.guild.id;
    const settings = getAutomodSettings(guildId);

    const response = applySetting(sub, status, threshold, settings);
    if (response.error) return interaction.followUp({ embeds: [EmbedUtils.error(response.error)] });

    setAutomodSettings(guildId, response.update);
    return interaction.followUp({ embeds: [EmbedUtils.success(response.message)] });
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

function applySetting(sub, enabled, thresholdInput, settings) {
  if (sub === "ghostping") {
    return {
      update: { anti_ghostping: enabled },
      message: `Anti-ghostping is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "spam") {
    return {
      update: { anti_spam: enabled },
      message: `Anti-spam is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "caps") {
    return {
      update: { anti_caps: enabled },
      message: `Anti-caps is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "repeat") {
    return {
      update: { anti_repeat: enabled },
      message: `Anti-repeat is now ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  if (sub === "massmention") {
    if (!enabled) {
      return {
        update: { anti_massmention: 0 },
        message: "Anti-massmention is now disabled.",
      };
    }

    const rawThreshold = thresholdInput ?? settings.anti_massmention ?? 3;
    const parsed = Number.parseInt(rawThreshold, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { error: "Threshold must be a number greater than 0." };
    }

    return {
      update: { anti_massmention: parsed },
      message: `Anti-massmention is now enabled with threshold ${parsed}.`,
    };
  }

  return { error: "Invalid anti subcommand." };
}

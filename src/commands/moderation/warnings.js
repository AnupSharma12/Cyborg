const { ApplicationCommandOptionType } = require("discord.js");
const { getWarnings, clearWarnings } = require("@root/src/database/warnings");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warnings",
  description: "View or clear warnings for a user",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  command: {
    enabled: true,
    usage: "<@member|ID> [clear]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The member to check warnings for",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "clear",
        description: "Clear all warnings for this user",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = args[0].match(/(\d{17,20})/);
    if (!match) return message.reply("Please provide a valid member mention or ID.");

    const target = await message.guild.members.fetch(match[1]).catch(() => null);
    if (!target) return message.reply("Could not find that member.");

    const shouldClear = args[1]?.toLowerCase() === "clear";

    if (shouldClear) {
      const count = clearWarnings(message.guild.id, target.id);
      return message.reply({ embeds: [EmbedUtils.success(`Cleared **${count}** warning(s) for **${target.user.username}**`)] });
    }

    const response = formatWarnings(target);
    await message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const shouldClear = interaction.options.getBoolean("clear") || false;
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp({ embeds: [EmbedUtils.error("Could not find that member.")] });

    if (shouldClear) {
      const count = clearWarnings(interaction.guild.id, target.id);
      return interaction.followUp({ embeds: [EmbedUtils.success(`Cleared **${count}** warning(s) for **${target.user.username}**`)] });
    }

    const response = formatWarnings(target);
    await interaction.followUp({ embeds: [response] });
  },
};

function formatWarnings(target) {
  const warnings = getWarnings(target.guild.id, target.id);
  if (warnings.length === 0) {
    return EmbedUtils.embed()
      .setDescription(`${target.user.username} has no warnings.`);
  }

  const list = warnings
    .map((w, i) => {
      const date = new Date(w.timestamp).toLocaleDateString();
      return `**${i + 1}.** ${w.reason}\n\u2514 By: ${w.issuerName} \u2022 ${date}`;
    })
    .join("\n\n");

  return EmbedUtils.embed()
    .setAuthor({ name: `Warnings for ${target.user.username}`, iconURL: target.user.displayAvatarURL() })
    .setDescription(list)
    .setFooter({ text: `Total: ${warnings.length} warning(s)` });
}

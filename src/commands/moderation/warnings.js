const { ApplicationCommandOptionType } = require("discord.js");
const { getWarnings, clearWarnings } = require("@root/src/database/warnings");

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
      return message.reply(`Cleared **${count}** warning(s) for **${target.user.username}**.`);
    }

    const response = formatWarnings(message.guild, target);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const shouldClear = interaction.options.getBoolean("clear") || false;
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    if (shouldClear) {
      const count = clearWarnings(interaction.guild.id, target.id);
      return interaction.followUp(`Cleared **${count}** warning(s) for **${target.user.username}**.`);
    }

    const response = formatWarnings(interaction.guild, target);
    await interaction.followUp(response);
  },
};

function formatWarnings(guild, target) {
  const warnings = getWarnings(guild.id, target.id);
  if (warnings.length === 0) return `**${target.user.username}** has no warnings.`;

  const list = warnings
    .map((w, i) => {
      const date = new Date(w.timestamp).toLocaleDateString();
      return `**${i + 1}.** ${w.reason} — by ${w.issuerName} (${date})`;
    })
    .join("\n");

  return `**${target.user.username}** has **${warnings.length}** warning(s):\n${list}`;
}

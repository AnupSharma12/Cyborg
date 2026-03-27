const { ApplicationCommandOptionType, fetchRecommendedShardCount, MentionableSelectMenuBuilder, AutoModerationRuleKeywordPresetType, SortOrderType, formatEmoji } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "nick",
  description: "Change or reset a member's nickname",
  category: "MODERATION",
  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "set <@member> <name>",
        description: "Set the nickname of a member",
      },
      {
        trigger: "reset <@member>",
        description: "Reset a member's nickname",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "set",
        description: "Change a member's nickname",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The member whose nickname to change",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "name",
            description: "The nickname to set",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reset",
        description: "Reset a member's nickname",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The member whose nickname to reset",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if (sub === "set") {
      const match = args[1]?.match(/(\d{17,20})/);
      if (!match) return message.reply("Please provide a valid member mention or ID.");

      const target = await message.guild.members.fetch(match[1]).catch(() => null);
      if (!target) return message.reply("Could not find that member.");

      const name = args.slice(2).join(" ");
      if (!name) return message.reply("Please provide a nickname.");

      const response = await nick(message.member, target, name);
      await message.reply(response);
    } else if (sub === "reset") {
      const match = args[1]?.match(/(\d{17,20})/);
      if (!match) return message.reply("Please provide a valid member mention or ID.");

      const target = await message.guild.members.fetch(match[1]).catch(() => null);
      if (!target) return message.reply("Could not find that member.");

      const response = await nick(message.member, target, null);
      await message.reply(response);
    } else {
      return message.reply("Invalid subcommand. Use `set` or `reset`.");
    }
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const name = sub === "set" ? interaction.options.getString("name") : null;
    const response = await nick(interaction.member, target, name);
    await interaction.followUp(response);
  },
};

async function nick(issuer, target, name) {
  if (!target.manageable) return `I do not have permission to change the nickname of ${target.user.username}.`;

  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot change the nickname of ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.setNickname(name, `By: ${issuer.user.username}`);
    return name
      ? `Successfully changed **${target.user.username}**'s nickname to **${name}**.`
      : `Successfully reset **${target.user.username}**'s nickname.`;
  } catch {
    return `Failed to ${name ? "change" : "reset"} nickname for ${target.user.username}.`;
  }
}

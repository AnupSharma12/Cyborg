const { ApplicationCommandOptionType, shouldUseGlobalFetchAndWebSocket, MentionableSelectMenuBuilder, ApplicationCommandNumericOptionMinMaxValueMixin, fetchRecommendedShardCount, SubscriptionManager, FileUploadAssertions } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "softban",
  description: "Ban and immediately unban a member to delete their messages",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    usage: "<@member|ID> [days] [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The member to softban",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "days",
        description: "Number of days of messages to delete (1-7, default 7)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 1,
        maxValue: 7,
      },
      {
        name: "reason",
        description: "Reason for the softban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = args[0].match(/(\d{17,20})/);
    if (!match) return message.reply("Please provide a valid member mention or ID.");

    const target = await message.guild.members.fetch(match[1]).catch(() => null);
    if (!target) return message.reply("Could not find that member.");

    let days = 7;
    let reason = "No reason provided";
    if (args.length > 1) {
      const parsed = parseInt(args[1]);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
        days = parsed;
        reason = args.slice(2).join(" ") || reason;
      } else {
        reason = args.slice(1).join(" ");
      }
    }

    const response = await softban(message.member, target, reason, days);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const days = interaction.options.getInteger("days") || 7;
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const response = await softban(interaction.member, target, reason, days);
    await interaction.followUp(response);
  },
};

async function softban(issuer, target, reason, days) {
  if (!target.bannable) return `I do not have permission to softban ${target.user.username}.`;
  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot softban ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.ban({ deleteMessageSeconds: days * 86400, reason: `Softban: ${reason} | By: ${issuer.user.username}` });
    await target.guild.members.unban(target.id, "Softban unban");
    return `Successfully softbanned **${target.user.username}** (deleted ${days} day(s) of messages). Reason: ${reason}`;
  } catch {
    return `Failed to softban ${target.user.username}.`;
  }
}

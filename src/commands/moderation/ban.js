const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ban",
  description: "Ban a member from the server",
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
        description: "The member to ban",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "days",
        description: "Number of days of messages to delete (0-7)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 0,
        maxValue: 7,
      },
      {
        name: "reason",
        description: "Reason for the ban",
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

    let days = 0;
    let reason = "No reason provided";
    if (args.length > 1) {
      const parsed = parseInt(args[1]);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 7) {
        days = parsed;
        reason = args.slice(2).join(" ") || reason;
      } else {
        reason = args.slice(1).join(" ");
      }
    }

    const response = await ban(message.member, target, reason, days);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const days = interaction.options.getInteger("days") || 0;
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const response = await ban(interaction.member, target, reason, days);
    await interaction.followUp(response);
  },
};

async function ban(issuer, target, reason, days) {
  if (!target.bannable) return `I do not have permission to ban ${target.user.username}.`;
  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot ban ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.ban({ deleteMessageDays: days, reason: `${reason} | By: ${issuer.user.username}` });
    return `Successfully banned **${target.user.username}**. Reason: ${reason}`;
  } catch {
    return `Failed to ban ${target.user.username}.`;
  }
}
 
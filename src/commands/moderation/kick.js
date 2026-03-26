const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "kick",
  description: "Kick a member from the server",
  category: "MODERATION",
  botPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    usage: "<@member|ID> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The member to kick",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the kick",
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

    const reason = args.slice(1).join(" ") || "No reason provided";
    const response = await kick(message.member, target, reason);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const response = await kick(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function kick(issuer, target, reason) {
  if (!target.kickable) return `I do not have permission to kick ${target.user.username}.`;
  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot kick ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.kick(`${reason} | By: ${issuer.user.username}`);
    return `Successfully kicked **${target.user.username}**. Reason: ${reason}`;
  } catch {
    return `Failed to kick ${target.user.username}.`;
  }
}
const { ApplicationCommandOptionType } = require("discord.js");
const { addWarning } = require("@root/src/database/warnings");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "Warn a member (DMs the warning to them)",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
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
        description: "The member to warn",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the warning",
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
    const response = await warn(message.guild, message.member, target, reason);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const response = await warn(interaction.guild, interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(guild, issuer, target, reason) {
  if (target.user.bot) return "You cannot warn a bot.";
  const isOwner = issuer.id === guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot warn ${target.user.username} — they have an equal or higher role.`;
  }

  const count = addWarning(guild.id, target.id, {
    reason,
    issuerId: issuer.id,
    issuerName: issuer.user.username,
    timestamp: Date.now(),
  });

  await target.user
    .send(`You have been warned in **${guild.name}**. Reason: ${reason}`)
    .catch(() => null);

  return `**${target.user.username}** has been warned. They now have **${count}** warning(s). Reason: ${reason}`;
}

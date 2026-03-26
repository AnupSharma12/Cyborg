const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "unban",
  description: "Unban a previously banned user",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    usage: "<userID> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "userid",
        description: "The ID of the banned user",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the unban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = args[0].match(/(\d{17,20})/);
    if (!match) return message.reply("Please provide a valid user ID.");

    const reason = args.slice(1).join(" ") || "No reason provided";
    const response = await unban(message.guild, match[1], reason, message.author.username);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const userId = interaction.options.getString("userid");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const match = userId.match(/(\d{17,20})/);
    if (!match) return interaction.followUp("Please provide a valid user ID.");

    const response = await unban(interaction.guild, match[1], reason, interaction.user.username);
    await interaction.followUp(response);
  },
};

async function unban(guild, userId, reason, issuerName) {
  const ban = await guild.bans.fetch(userId).catch(() => null);
  if (!ban) return `User \`${userId}\` is not banned.`;

  try {
    await guild.members.unban(userId, `${reason} | By: ${issuerName}`);
    return `Successfully unbanned **${ban.user.username}**.`;
  } catch {
    return `Failed to unban user \`${userId}\`.`;
  }
}

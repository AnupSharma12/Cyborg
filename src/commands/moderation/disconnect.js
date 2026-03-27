const { ApplicationCommandOptionType } = require("discord.js");
const { success, error } = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "disconnect",
  description: "Disconnect a member from voice",
  category: "MODERATION",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
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
        description: "The member to disconnect from voice",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the disconnect",
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
    const response = await disconnect(message.member, target, reason);
    await message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);

    const response = await disconnect(interaction.member, target, reason);
    await interaction.followUp({ embeds: [response] });
  },
};

async function disconnect(issuer, target, reason) {
  if (!target.voice.channel) return error(`${target.user.username} is not in a voice channel.`);

  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return error(`You cannot disconnect ${target.user.username} \u2014 they have an equal or higher role.`);
  }

  try {
    await target.voice.disconnect(`${reason} | By: ${issuer.user.username}`);
    return success(`Disconnected **${target.user.username}** from voice\nReason: ${reason}`);
  } catch {
    return error(`Failed to disconnect ${target.user.username}.`);
  }
}

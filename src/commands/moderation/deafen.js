const { ApplicationCommandOptionType } = require("discord.js");
const { success, error } = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "deafen",
  description: "Server deafen a member in voice",
  category: "MODERATION",
  botPermissions: ["DeafenMembers"],
  userPermissions: ["DeafenMembers"],
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
        description: "The member to deafen",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the deafen",
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
    const response = await deafen(message.member, target, reason);
    await message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);

    const response = await deafen(interaction.member, target, reason);
    await interaction.followUp({ embeds: [response] });
  },
};

async function deafen(issuer, target, reason) {
  if (!target.voice.channel) return error(`${target.user.username} is not in a voice channel.`);
  if (target.voice.deaf) return error(`${target.user.username} is already server deafened.`);

  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return error(`You cannot deafen ${target.user.username} \u2014 they have an equal or higher role.`);
  }

  try {
    await target.voice.setDeaf(true, `${reason} | By: ${issuer.user.username}`);
    return success(`Deafened **${target.user.username}**\nReason: ${reason}`);
  } catch {
    return error(`Failed to deafen ${target.user.username}.`);
  }
}

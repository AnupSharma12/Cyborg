const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "vmute",
  description: "Server mute a member in voice",
  category: "MODERATION",
  botPermissions: ["MuteMembers"],
  userPermissions: ["MuteMembers"],
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
        description: "The member to voice mute",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the voice mute",
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
    const response = await vmute(message.member, target, reason);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);

    const response = await vmute(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function vmute(issuer, target, reason) {
  if (!target.voice.channel) return `${target.user.username} is not in a voice channel.`;
  if (target.voice.mute) return `${target.user.username} is already server muted.`;

  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot voice mute ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.voice.setMute(true, `${reason} | By: ${issuer.user.username}`);
    return `Successfully voice muted **${target.user.username}**. Reason: ${reason}`;
  } catch {
    return `Failed to voice mute ${target.user.username}.`;
  }
}

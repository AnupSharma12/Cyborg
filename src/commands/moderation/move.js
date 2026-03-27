const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { success, error } = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "move",
  description: "Move a member to another voice channel",
  category: "MODERATION",
  botPermissions: ["MoveMembers"],
  userPermissions: ["MoveMembers"],
  command: {
    enabled: true,
    usage: "<@member|ID> <channelID>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The member to move",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "channel",
        description: "The voice channel to move the member to",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the move",
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

    const channelMatch = args[1]?.match(/(\d{17,20})/);
    if (!channelMatch) return message.reply("Please provide a valid channel mention or ID.");

    const channel = message.guild.channels.cache.get(channelMatch[1]);
    if (!channel || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
      return message.reply("Please provide a valid voice channel.");
    }

    const reason = args.slice(2).join(" ") || "No reason provided";
    const response = await move(message.member, target, channel, reason);
    await message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const channel = interaction.options.getChannel("channel");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);

    const response = await move(interaction.member, target, channel, reason);
    await interaction.followUp({ embeds: [response] });
  },
};

async function move(issuer, target, channel, reason) {
  if (!target.voice.channel) return error(`${target.user.username} is not in a voice channel.`);
  if (target.voice.channelId === channel.id) return error(`${target.user.username} is already in that channel.`);

  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return error(`You cannot move ${target.user.username} \u2014 they have an equal or higher role.`);
  }

  try {
    await target.voice.setChannel(channel, `${reason} | By: ${issuer.user.username}`);
    return success(`Moved **${target.user.username}** to **${channel.name}**\nReason: ${reason}`);
  } catch {
    return error(`Failed to move ${target.user.username}.`);
  }
}

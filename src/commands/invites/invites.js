const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const {
  getGuildInviteSettings,
  getGuildMemberInviteData,
  getEffectiveInvites,
} = require("@src/database/invites");

module.exports = {
  name: "invites",
  description: "Show member invite count",
  category: "INVITE",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[@member|id]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to check invites for",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await resolveTargetMember(message, args[0]);
    if (!target) return message.reply("Could not find that member.");

    const response = getInviteStatsEmbed(message.guild.id, target.user);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = getInviteStatsEmbed(interaction.guild.id, user);
    return interaction.followUp({ embeds: [response] });
  },
};

async function resolveTargetMember(message, query) {
  if (!query) return message.member;
  const id = query.match(/(\d{17,20})/)?.[1];
  if (!id) return null;
  return message.guild.members.fetch(id).catch(() => null);
}

function getInviteStatsEmbed(guildId, user) {
  const settings = getGuildInviteSettings(guildId);
  if (!settings.tracking) {
    return EmbedUtils.warning("Invite tracking is disabled in this server.");
  }

  const inviteData = getGuildMemberInviteData(guildId, user.id);
  const effective = getEffectiveInvites(inviteData);

  return EmbedUtils.embed()
    .setAuthor({ name: `Invites for ${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(`${user} has **${effective}** effective invites.`)
    .addFields(
      { name: "Tracked", value: String(inviteData.tracked || 0), inline: true },
      { name: "Added", value: String(inviteData.added || 0), inline: true },
      { name: "Left", value: String(inviteData.left || 0), inline: true }
    );
}

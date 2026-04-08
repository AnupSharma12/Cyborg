const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const {
  getGuildInviteSettings,
  getGuildMemberInviteData,
  getEffectiveInvites,
} = require("@src/database/invites");

module.exports = {
  name: "inviter",
  description: "Show who invited a member",
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
        description: "The user to inspect",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await resolveTargetMember(message, args[0]);
    if (!target) return message.reply("Could not find that member.");

    const response = await getInviterEmbed(message.guild, target.user);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await getInviterEmbed(interaction.guild, user);
    return interaction.followUp({ embeds: [response] });
  },
};

async function resolveTargetMember(message, query) {
  if (!query) return message.member;
  const id = query.match(/(\d{17,20})/)?.[1];
  if (!id) return null;
  return message.guild.members.fetch(id).catch(() => null);
}

async function getInviterEmbed(guild, user) {
  const settings = getGuildInviteSettings(guild.id);
  if (!settings.tracking) return EmbedUtils.warning("Invite tracking is disabled in this server.");

  const inviteData = getGuildMemberInviteData(guild.id, user.id);
  if (!inviteData.inviter) return EmbedUtils.warning(`Cannot track who invited ${user.username}.`);

  const inviterUser =
    inviteData.inviter === "VANITY"
      ? null
      : await guild.client.users.fetch(inviteData.inviter).catch(() => null);

  const inviterStats =
    inviteData.inviter && inviteData.inviter !== "VANITY"
      ? getGuildMemberInviteData(guild.id, inviteData.inviter)
      : null;

  return EmbedUtils.embed()
    .setAuthor({ name: `Inviter data for ${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(
      `Inviter: ${inviterUser ? `**${inviterUser.username}**` : "**Vanity/Unknown**"}\n` +
      `Inviter ID: \`${inviteData.inviter || "Unknown"}\`\n` +
      `Invite Code: \`${inviteData.code || "Unknown"}\`\n` +
      `Inviter Invites: **${inviterStats ? getEffectiveInvites(inviterStats) : 0}**`
    );
}

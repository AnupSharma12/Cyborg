const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

module.exports = {
  name: "invitecodes",
  description: "List invite codes",
  category: "INVITE",
  botPermissions: ["EmbedLinks", "ManageGuild"],
  command: {
    enabled: true,
    usage: "[@member|id]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to get invite codes for",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await resolveTargetMember(message, args[0]);
    if (!target) return message.reply("Could not find that member.");

    const response = await buildInviteCodesEmbed(message.guild, target.user);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await buildInviteCodesEmbed(interaction.guild, user);
    return interaction.followUp({ embeds: [response] });
  },
};

async function resolveTargetMember(message, query) {
  if (!query) return message.member;
  const id = query.match(/(\d{17,20})/)?.[1];
  if (!id) return null;
  return message.guild.members.fetch(id).catch(() => null);
}

async function buildInviteCodesEmbed(guild, user) {
  const invites = await guild.invites.fetch({ cache: false }).catch(() => null);
  if (!invites) return EmbedUtils.error("Failed to fetch invites. Make sure I have Manage Server permission.");

  const mine = invites.filter((inv) => inv.inviter?.id === user.id);
  if (mine.size === 0) return EmbedUtils.warning(`${user.username} has no invite codes in this server.`);

  const lines = [];
  mine.forEach((inv) => lines.push(`- [${inv.code}](${inv.url}) - ${inv.uses} uses`));

  return EmbedUtils.embed()
    .setAuthor({ name: `Invite codes for ${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(lines.slice(0, 20).join("\n"));
}

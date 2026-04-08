const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { resetGuildMemberInvites } = require("@src/database/invites");
const { checkInviteRewards } = require("@handlers/invite");

module.exports = {
  name: "resetinvites",
  description: "Reset invite counts",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["clearinvites"],
    usage: "<@member|id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      { name: "user", description: "Target user", type: ApplicationCommandOptionType.User, required: true },
    ],
  },

  async messageRun(message, args) {
    const id = args[0].match(/(\d{17,20})/)?.[1];
    if (!id) return message.reply({ embeds: [EmbedUtils.error("Please provide a valid user.")] });

    const target = await message.guild.members.fetch(id).catch(() => null);
    if (!target) return message.reply({ embeds: [EmbedUtils.error("Could not find that member.")] });

    const response = await clearInvites(message.guild, target.user);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const response = await clearInvites(interaction.guild, user);
    return interaction.followUp({ embeds: [response] });
  },
};

async function clearInvites(guild, user) {
  resetGuildMemberInvites(guild.id, user.id);
  await checkInviteRewards(guild, user.id);
  return EmbedUtils.success(`Invite counts reset for **${user.username}**.`);
}

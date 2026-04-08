const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const {
  adjustGuildMemberInvites,
  getGuildMemberInviteData,
  getEffectiveInvites,
} = require("@src/database/invites");
const { checkInviteRewards } = require("@handlers/invite");

module.exports = {
  name: "addinvites",
  description: "Manually add invites",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<@member|id> <invites>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      { name: "user", description: "Target user", type: ApplicationCommandOptionType.User, required: true },
      { name: "invites", description: "Invites to add", type: ApplicationCommandOptionType.Integer, required: true },
    ],
  },

  async messageRun(message, args) {
    const id = args[0].match(/(\d{17,20})/)?.[1];
    const amount = Number(args[1]);
    if (!id) return message.reply({ embeds: [EmbedUtils.error("Please provide a valid user.")] });
    if (!Number.isFinite(amount)) return message.reply({ embeds: [EmbedUtils.error("Invites amount must be a number.")] });

    const target = await message.guild.members.fetch(id).catch(() => null);
    if (!target) return message.reply({ embeds: [EmbedUtils.error("Could not find that member.")] });

    const response = await addInvites(message.guild, target.user, amount);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("invites");
    const response = await addInvites(interaction.guild, user, amount);
    return interaction.followUp({ embeds: [response] });
  },
};

async function addInvites(guild, user, amount) {
  if (user.bot) return EmbedUtils.error("You cannot add invites to bots.");

  adjustGuildMemberInvites(guild.id, user.id, { added: amount });
  const data = getGuildMemberInviteData(guild.id, user.id);
  await checkInviteRewards(guild, user.id);

  return EmbedUtils.success(`${user.username} now has **${getEffectiveInvites(data)}** invites.`);
}

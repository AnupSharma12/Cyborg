const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { getGuildInviteSettings, setGuildInviteSettings } = require("@src/database/invites");

module.exports = {
  name: "inviterank",
  description: "Auto-rank by invite count",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<add|remove> <@role> [invites]",
    minArgsCount: 2,
    subcommands: [
      { trigger: "add <@role> <invites>", description: "Add invite-based auto rank" },
      { trigger: "remove <@role>", description: "Remove invite-based auto rank" },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "add",
        description: "Add invite rank",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          { name: "role", description: "Role to grant", type: ApplicationCommandOptionType.Role, required: true },
          { name: "invites", description: "Required invites", type: ApplicationCommandOptionType.Integer, required: true },
        ],
      },
      {
        name: "remove",
        description: "Remove invite rank",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          { name: "role", description: "Configured role", type: ApplicationCommandOptionType.Role, required: true },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = (args[0] || "").toLowerCase();
    const roleId = args[1]?.match(/(\d{17,20})/)?.[1];
    const role = roleId ? message.guild.roles.cache.get(roleId) : null;

    if (!role) return message.reply({ embeds: [EmbedUtils.error("Please mention a valid role.")] });

    if (sub === "add") {
      const invites = Number(args[2]);
      if (!Number.isFinite(invites) || invites < 1) {
        return message.reply({ embeds: [EmbedUtils.error("Please provide a valid invite count.")] });
      }
      const response = saveRank(message.guild.id, role.id, invites);
      return message.reply({ embeds: [EmbedUtils.success(response)] });
    }

    if (sub === "remove") {
      const response = removeRank(message.guild.id, role.id);
      return message.reply({ embeds: [EmbedUtils.success(response)] });
    }

    return message.reply({ embeds: [EmbedUtils.error("Usage: `inviterank <add|remove> <@role> [invites]`")] });
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const role = interaction.options.getRole("role");

    if (sub === "add") {
      const invites = interaction.options.getInteger("invites");
      const response = saveRank(interaction.guild.id, role.id, invites);
      return interaction.followUp({ embeds: [EmbedUtils.success(response)] });
    }

    const response = removeRank(interaction.guild.id, role.id);
    return interaction.followUp({ embeds: [EmbedUtils.success(response)] });
  },
};

function saveRank(guildId, roleId, invites) {
  const settings = getGuildInviteSettings(guildId);
  const ranks = settings.ranks || [];
  const existing = ranks.find((r) => r.roleId === roleId);

  if (existing) existing.invites = invites;
  else ranks.push({ roleId, invites });

  setGuildInviteSettings(guildId, { ...settings, ranks });
  return "Invite rank configuration saved.";
}

function removeRank(guildId, roleId) {
  const settings = getGuildInviteSettings(guildId);
  const ranks = (settings.ranks || []).filter((r) => r.roleId !== roleId);
  setGuildInviteSettings(guildId, { ...settings, ranks });
  return "Invite rank removed.";
}

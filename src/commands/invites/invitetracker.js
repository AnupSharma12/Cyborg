const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { cacheGuildInvites, resetInviteCache } = require("@handlers/invite");
const { getGuildInviteSettings, setGuildInviteSettings } = require("@src/database/invites");

module.exports = {
  name: "invitetracker",
  description: "Enable or disable invite tracking",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["invitetracking"],
    usage: "<on|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "status",
        description: "Tracking status",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "ON", value: "ON" },
          { name: "OFF", value: "OFF" },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
      return message.reply({ embeds: [EmbedUtils.error("Invalid status. Use `on` or `off`.")] });
    }
    const response = await setTracking(message.guild, status === "on");
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const status = interaction.options.getString("status") === "ON";
    const response = await setTracking(interaction.guild, status);
    return interaction.followUp({ embeds: [response] });
  },
};

async function setTracking(guild, enabled) {
  if (enabled) {
    if (!guild.members.me.permissions.has("ManageGuild")) {
      return EmbedUtils.error("I need `Manage Server` permission to track invites.");
    }
    await cacheGuildInvites(guild);
  } else {
    resetInviteCache(guild.id);
  }

  const current = getGuildInviteSettings(guild.id);
  setGuildInviteSettings(guild.id, { ...current, tracking: enabled });

  return EmbedUtils.success(`Invite tracking is now **${enabled ? "enabled" : "disabled"}**.`);
}

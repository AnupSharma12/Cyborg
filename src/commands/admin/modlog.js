const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { MODLOG_TYPES, getModlogChannelId, setModlogChannelId } = require("@src/database/modlog");

module.exports = {
  name: "modlog",
  description: "Configure moderation log channel",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<user|channel|roles|message> <#channel|off>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "log",
        description: "Type of logs to configure",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "user (join/leave)", value: "user" },
          { name: "channel (create/update/delete)", value: "channel" },
          { name: "roles (create/update/delete)", value: "roles" },
          { name: "message (edit/delete)", value: "message" },
        ],
      },
      {
        name: "channel",
        description: "Channel to send moderation logs to",
        type: ApplicationCommandOptionType.Channel,
        required: true,
        channelTypes: [ChannelType.GuildText],
      },
    ],
  },

  async messageRun(message, args) {
    const logType = (args[0] || "").toLowerCase();
    const input = (args[1] || "").toLowerCase();

    if (!MODLOG_TYPES.includes(logType)) {
      return message.reply({ embeds: [EmbedUtils.error("Usage: `modlog <user|channel|roles|message> <#channel|off>`")] });
    }

    if (["off", "disable", "none"].includes(input)) {
      const response = disableModlog(message.guild.id, logType);
      return message.reply({ embeds: [response] });
    }

    const channelId = args[1].match(/(\d{17,20})/)?.[1];
    if (!channelId) {
      return message.reply({ embeds: [EmbedUtils.error("Usage: `modlog <user|channel|roles|message> <#channel|off>`")] });
    }

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply({ embeds: [EmbedUtils.error("Please provide a valid text channel.")] });
    }

    const response = setModlog(message.guild, logType, channel);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const logType = interaction.options.getString("log");
    const channel = interaction.options.getChannel("channel");

    const response = setModlog(interaction.guild, logType, channel);
    return interaction.followUp({ embeds: [response] });
  },
};

function disableModlog(guildId, type) {
  const existing = getModlogChannelId(guildId, type);
  if (!existing) return EmbedUtils.warning(`Modlog for **${type}** is already disabled.`);

  setModlogChannelId(guildId, type, null);
  return EmbedUtils.success(`Modlog for **${type}** removed.`);
}

function setModlog(guild, type, channel) {
  const perms = channel.permissionsFor(guild.members.me);
  if (!perms?.has(["SendMessages", "EmbedLinks"])) {
    return EmbedUtils.error("I need `Send Messages` and `Embed Links` in that channel.");
  }

  setModlogChannelId(guild.id, type, channel.id);
  return EmbedUtils.success(`Modlog for **${type}** set to ${channel}.`);
}

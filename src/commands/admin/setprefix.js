const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { setGuildPrefix } = require("@src/database/prefix");

module.exports = {
  name: "setprefix",
  description: "Server-specific custom prefix",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<new-prefix>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
    ephemeral: true,
    options: [
      {
        name: "newprefix",
        description: "The new prefix",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const response = setNewPrefix(message.guild.id, args[0]);
    return message.reply({ embeds: [response] });
  },

  async interactionRun(interaction) {
    const response = setNewPrefix(
      interaction.guild.id,
      interaction.options.getString("newprefix")
    );
    return interaction.followUp({ embeds: [response] });
  },
};

function setNewPrefix(guildId, newPrefix) {
  if (!newPrefix || newPrefix.trim().length === 0) {
    return EmbedUtils.error("Prefix cannot be empty.");
  }

  if (newPrefix.length > 3) {
    return EmbedUtils.error("Prefix length cannot exceed 3 characters.");
  }

  setGuildPrefix(guildId, newPrefix);
  return EmbedUtils.success(`New prefix set to \`${newPrefix}\`.`);
}

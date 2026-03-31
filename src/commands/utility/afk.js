const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { setAfk } = require("@src/database/afk");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "afk",
  description: "Set your AFK status with an optional reason",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[reason]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "reason",
        description: "Why you are AFK",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const reason = (args.join(" ").trim() || "AFK").slice(0, 200);
    const afk = setAfk(message.guild.id, message.author.id, reason);

    await message.reply({
      embeds: [
        EmbedUtils.success(`You are now AFK: **${afk.reason}**`)
          .setFooter({ text: "You will be marked back when you send a new message." }),
      ],
    });
  },

  async interactionRun(interaction) {
    const reason = (interaction.options.getString("reason") || "AFK").trim().slice(0, 200);
    const afk = setAfk(interaction.guild.id, interaction.user.id, reason);

    await interaction.followUp({
      embeds: [
        EmbedUtils.success(`You are now AFK: **${afk.reason}**`)
          .setFooter({ text: "You will be marked back when you send a new message." }),
      ],
    });
  },
};

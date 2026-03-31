const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { REACTIONS, getReactionGif } = require("@helpers/reactions");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "slap",
  description: "Slap someone",
  category: "ANIME",
  cooldown: 5,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<@user>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to slap",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.users.first() || (await message.client.users.fetch(args[0]).catch(() => null));
    if (!target) return message.reply({ embeds: [EmbedUtils.error("Please mention a valid user.")] });
    const embed = await buildEmbed("slap", message.author, target);
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const embed = await buildEmbed("slap", interaction.user, target);
    await interaction.followUp({ embeds: [embed] });
  },
};

async function buildEmbed(type, user, target) {
  const r = REACTIONS[type];
  const gif = await getReactionGif(type);
  if (!gif) return EmbedUtils.error("Failed to fetch reaction. Try again!");
  return EmbedUtils.embed()
    .setDescription(`${r.emoji} **${user.username}** ${r.verb} **${target.username}**`)
    .setImage(gif)
    .setColor("Random");
}

const EmbedUtils = require("@helpers/EmbedUtils");
const { REACTIONS, getReactionGif } = require("@helpers/reactions");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "smug",
  description: "Show a smug face",
  category: "ANIME",
  cooldown: 5,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message) {
    const embed = await buildEmbed(message.author);
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const embed = await buildEmbed(interaction.user);
    await interaction.followUp({ embeds: [embed] });
  },
};

async function buildEmbed(user) {
  const r = REACTIONS["smug"];
  const gif = await getReactionGif("smug");
  if (!gif) return EmbedUtils.error("Failed to fetch reaction. Try again!");
  return EmbedUtils.embed()
    .setDescription(`${r.emoji} **${user.username}** is smug`)
    .setImage(gif)
    .setColor("Random");
}

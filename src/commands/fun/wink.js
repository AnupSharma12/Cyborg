const EmbedUtils = require("@helpers/EmbedUtils");
const { REACTIONS, getReactionGif } = require("@helpers/reactions");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "wink",
  description: "Wink at everyone",
  category: "FUN",
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
  const r = REACTIONS["wink"];
  const gif = await getReactionGif("wink");
  if (!gif) return EmbedUtils.error("Failed to fetch reaction. Try again!");
  return EmbedUtils.embed()
    .setDescription(`${r.emoji} **${user.username}** winks`)
    .setImage(gif)
    .setColor("Random");
}

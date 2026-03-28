const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const ANIMALS = ["cat", "dog", "panda", "fox", "red_panda", "koala", "bird", "raccoon", "kangaroo"];
const BASE_URL = "https://some-random-api.com/animal";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "animal",
  description: "Random animal picture with a fun fact",
  category: "FUN",
  cooldown: 5,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<type>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "type",
        description: "The type of animal",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: ANIMALS.map((a) => ({ name: a.replace("_", " "), value: a })),
      },
    ],
  },

  async messageRun(message, args) {
    const choice = args[0].toLowerCase();
    if (!ANIMALS.includes(choice)) {
      return message.reply({
        embeds: [EmbedUtils.error(`Invalid animal. Choose from: ${ANIMALS.join(", ")}`)],
      });
    }
    const embed = await getAnimal(choice);
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("type");
    const embed = await getAnimal(choice);
    await interaction.followUp({ embeds: [embed] });
  },
};

async function getAnimal(type) {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(type)}`, { signal: AbortSignal.timeout(10_000) });
    const json = await res.json();
    if (!json.image) return EmbedUtils.error("Failed to fetch animal. Try again!");
    const embed = EmbedUtils.embed()
      .setTitle(`${type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} 🐾`)
      .setImage(json.image);
    if (json.fact) embed.setDescription(`**Fun Fact:** ${json.fact}`);
    return embed;
  } catch {
    return EmbedUtils.error("Failed to fetch animal. Try again!");
  }
}

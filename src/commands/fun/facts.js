const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const ANIMALS = ["cat", "dog", "panda", "fox", "red_panda", "koala", "bird", "raccoon", "kangaroo"];
const BASE_URL = "https://some-random-api.com/animal";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "facts",
  description: "Random animal facts",
  category: "FUN",
  cooldown: 5,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<animal>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "animal",
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
    const embed = await getFact(choice);
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("animal");
    const embed = await getFact(choice);
    await interaction.followUp({ embeds: [embed] });
  },
};

async function getFact(type) {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(type)}`, { signal: AbortSignal.timeout(10_000) });
    const json = await res.json();
    if (!json.fact) return EmbedUtils.error("Failed to fetch fact. Try again!");
    const embed = EmbedUtils.embed()
      .setTitle(`${type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} Fact 📖`)
      .setDescription(json.fact);
    if (json.image) embed.setThumbnail(json.image);
    return embed;
  } catch {
    return EmbedUtils.error("Failed to fetch fact. Try again!");
  }
}

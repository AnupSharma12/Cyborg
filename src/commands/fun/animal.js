const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const ANIMALS = [
  { name: "Cat", value: "cat", emoji: "🐱" },
  { name: "Dog", value: "dog", emoji: "🐶" },
  { name: "Panda", value: "panda", emoji: "🐼" },
  { name: "Fox", value: "fox", emoji: "🦊" },
  { name: "Red Panda", value: "red_panda", emoji: "🔴" },
  { name: "Koala", value: "koala", emoji: "🐨" },
  { name: "Bird", value: "bird", emoji: "🐦" },
  { name: "Raccoon", value: "raccoon", emoji: "🦝" },
  { name: "Kangaroo", value: "kangaroo", emoji: "🦘" },
];
const BASE_URL = "https://some-random-api.com/animal";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "animal",
  description: "Get a random animal image with a fun fact",
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
        choices: ANIMALS.map((a) => ({ name: a.name, value: a.value })),
      },
    ],
  },

  async messageRun(message, args) {
    const choice = args[0].toLowerCase();
    const animal = ANIMALS.find((a) => a.value === choice);
    if (!animal) {
      return message.reply({
        embeds: [EmbedUtils.error(`Invalid animal. Choose from: ${ANIMALS.map((a) => `\`${a.value}\``).join(", ")}`)],
      });
    }
    const embed = await getAnimal(animal);
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("type");
    const animal = ANIMALS.find((a) => a.value === choice);
    const embed = await getAnimal(animal);
    await interaction.followUp({ embeds: [embed] });
  },
};

async function getAnimal(animal) {
  try {
    const res = await fetch(`${BASE_URL}/${animal.value}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return EmbedUtils.error("Failed to fetch animal. Try again!");
    const json = await res.json();
    if (!json.image) return EmbedUtils.error("Failed to fetch animal. Try again!");
    const embed = EmbedUtils.embed()
      .setTitle(`${animal.emoji} ${animal.name}`)
      .setImage(json.image)
      .setColor("Random");
    if (json.fact) embed.setDescription(`**Fun Fact:** ${json.fact}`);
    return embed;
  } catch {
    return EmbedUtils.error("Failed to fetch animal. Try again!");
  }
}

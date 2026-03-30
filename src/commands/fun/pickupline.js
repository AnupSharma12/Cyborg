const EmbedUtils = require("@helpers/EmbedUtils");
const { GuildOnboarding, shouldUseGlobalFetchAndWebSocket } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "pickupline",
  description: "Get a random pickup line",
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
    const embed = await getPickupLine();
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const embed = await getPickupLine();
    await interaction.followUp({ embeds: [embed] });
  },
};

async function getPickupLine() {
  try {
    const res = await fetch("https://api.popcat.xyz/v2/pickuplines", { signal: AbortSignal.timeout(10_000) });
    const json = await res.json();
    if (json.error || !json.message?.pickupline) return EmbedUtils.error("Failed to fetch a pickup line. Try again!");
    return EmbedUtils.embed().setDescription(`💘 ${json.message.pickupline}`);
  } catch {
    return EmbedUtils.error("Failed to fetch a pickup line. Try again!");
  }
}
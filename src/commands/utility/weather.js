const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "weather",
  description: "Get current weather and forecast for a location",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<location>",
    minArgsCount: 1,
    aliases: ["forecast", "temp"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "location",
        description: "City or location name (e.g. tulsipur, nepal)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide a location. Usage: `!weather <location>`")],
      });
    }

    return handleWeather({
      query,
      requester: message.author,
      send: (payload) => message.reply(payload),
    });
  },

  async interactionRun(interaction) {
    const query = interaction.options.getString("location", true).trim();
    return handleWeather({
      query,
      requester: interaction.user,
      send: (payload) => interaction.followUp(payload),
    });
  },
};

async function handleWeather({ query, requester, send }) {
  try {
    const result = await fetchWeather(query);
    if (!result) {
      return send({ embeds: [EmbedUtils.error(`No weather results found for **${query}**.`)] });
    }

    return send({ embeds: [buildWeatherEmbed(result, requester)] });
  } catch (error) {
    return send({ embeds: [EmbedUtils.error(`Weather lookup failed: ${error.message}`)] });
  }
}

async function fetchWeather(query) {
  const url = `https://api.popcat.xyz/v2/weather?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API request failed.");
  }

  const data = await response.json();
  if (data.error || !Array.isArray(data.message) || data.message.length === 0) {
    return null;
  }

  // PopCat may return multiple matching locations. Use the first result.
  return data.message[0];
}

function buildWeatherEmbed(result, requester) {
  const location = result.location || {};
  const current = result.current || {};
  const forecast = Array.isArray(result.forecast) ? result.forecast : [];

  const forecastText = forecast
    .slice(0, 3)
    .map((d) => {
      const day = d.shortday || d.day || "Day";
      const high = d.high ?? "?";
      const low = d.low ?? "?";
      const sky = d.skytextday || "Unknown";
      const precip = d.precip ?? "0";
      return `**${day}**: ${sky} | H ${high}° / L ${low}° | 🌧 ${precip}%`;
    })
    .join("\n");

  const embed = EmbedUtils.embed()
    .setTitle(`Weather: ${location.name || "Unknown Location"}`)
    .addFields(
      {
        name: "Current",
        value:
          `🌡 Temperature: **${current.temperature ?? "?"}°${location.degreetype || "C"}**\n` +
          `🤔 Feels like: **${current.feelslike ?? "?"}°${location.degreetype || "C"}**\n` +
          `☁️ Condition: **${current.skytext || "Unknown"}**\n` +
          `💧 Humidity: **${current.humidity ?? "?"}%**\n` +
          `💨 Wind: **${current.winddisplay || current.windspeed || "Unknown"}**`,
        inline: false,
      },
      {
        name: "Forecast (3 days)",
        value: forecastText || "No forecast data available.",
        inline: false,
      }
    )
    .setFooter({
      text: `Requested by ${requester.username}`,
      iconURL: requester.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();

  if (current.imageUrl) {
    embed.setThumbnail(current.imageUrl);
  }

  return embed;
}
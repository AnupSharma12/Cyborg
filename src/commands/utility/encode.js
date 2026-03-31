const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "encode",
  description: "Encode text into binary",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<text>",
    minArgsCount: 1,
    aliases: ["binaryencode", "tobinary"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "text",
        description: "Text to encode into binary",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const text = args.join(" ").trim();
    if (!text) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide text to encode. Usage: `!encode <text>`")],
      });
    }

    return handleEncode({
      text,
      requester: message.author,
      send: (payload) => message.reply(payload),
    });
  },

  async interactionRun(interaction) {
    const text = interaction.options.getString("text", true).trim();
    return handleEncode({
      text,
      requester: interaction.user,
      send: (payload) => interaction.followUp(payload),
    });
  },
};

async function handleEncode({ text, requester, send }) {
  try {
    const encoded = await encodeText(text);
    return send({ embeds: [buildEncodeEmbed(text, encoded, requester)] });
  } catch (error) {
    return send({
      embeds: [EmbedUtils.error(`Encode failed: ${error.message}`)],
    });
  }
}

async function encodeText(text) {
  const url = `https://api.popcat.xyz/v2/encode?text=${encodeURIComponent(text)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API request failed.");
  }

  const data = await response.json();
  if (!data.error && data.message && typeof data.message.text === "string") {
    return data.message.text;
  }

  throw new Error("Invalid API response.");
}

function buildEncodeEmbed(input, encoded, requester) {
  const safeInput = truncate(input, 1024);
  const safeEncoded = truncate(encoded, 1024);

  return EmbedUtils.embed()
    .setTitle("Encode: Text to Binary")
    .addFields(
      { name: "Input", value: safeInput, inline: false },
      { name: "Binary", value: safeEncoded, inline: false }
    )
    .setFooter({
      text: `Requested by ${requester.username}`,
      iconURL: requester.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
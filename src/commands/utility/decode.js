const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "decode",
  description: "Decode binary into text",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<binary>",
    minArgsCount: 1,
    aliases: ["binarydecode", "frombinary"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "binary",
        description: "Binary text to decode",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const binary = args.join(" ").trim();
    if (!binary) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide binary to decode. Usage: `!decode <binary>`")],
      });
    }

    return handleDecode({
      binary,
      requester: message.author,
      send: (payload) => message.reply(payload),
    });
  },

  async interactionRun(interaction) {
    const binary = interaction.options.getString("binary", true).trim();
    return handleDecode({
      binary,
      requester: interaction.user,
      send: (payload) => interaction.followUp(payload),
    });
  },
};

async function handleDecode({ binary, requester, send }) {
  try {
    const decoded = await decodeBinary(binary);
    return send({ embeds: [buildDecodeEmbed(binary, decoded, requester)] });
  } catch (error) {
    return send({
      embeds: [EmbedUtils.error(`Decode failed: ${error.message}`)],
    });
  }
}

async function decodeBinary(binary) {
  const url = `https://api.popcat.xyz/v2/decode?binary=${encodeURIComponent(binary)}`;
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

function buildDecodeEmbed(input, decoded, requester) {
  const safeInput = truncate(input, 1024);
  const safeDecoded = truncate(decoded, 1024);

  return EmbedUtils.embed()
    .setTitle("Decode: Binary to Text")
    .addFields(
      { name: "Binary", value: safeInput, inline: false },
      { name: "Output", value: safeDecoded, inline: false }
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
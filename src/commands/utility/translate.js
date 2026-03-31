const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const LANGUAGE_CODES = {
  auto: "Auto-detect",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ar: "Arabic",
  hi: "Hindi",
  pl: "Polish",
  tr: "Turkish",
  vi: "Vietnamese",
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "translate",
  description: "Translate text to another language",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<text> [to language]",
    minArgsCount: 1,
    aliases: ["trans"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "text",
        description: "The text to translate",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "to",
        description: "Target language code (default: en)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "from",
        description: "Source language code (default: auto)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    if (args.length === 0) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide text to translate.\nUsage: `!translate <text> [to language]`")],
      });
    }

    let text = args.join(" ");
    let targetLang = "en";
    let sourceLang = "auto";

    // Check if last arg is a language code
    const lastArg = args[args.length - 1].toLowerCase();
    if (lastArg.length <= 5 && Object.keys(LANGUAGE_CODES).includes(lastArg)) {
      targetLang = lastArg;
      text = args.slice(0, -1).join(" ");
    }

    if (!text.trim()) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide valid text to translate.")],
      });
    }

    try {
      const translated = await translateText(text, targetLang, sourceLang);
      const embed = buildTranslateEmbed(text, translated, sourceLang, targetLang, message.author);
      return message.reply({ embeds: [embed] });
    } catch (error) {
      return message.reply({
        embeds: [EmbedUtils.error(`Translation failed: ${error.message}`)],
      });
    }
  },

  async interactionRun(interaction) {
    const text = interaction.options.getString("text", true).trim();
    const targetLang = interaction.options.getString("to") || "en";
    const sourceLang = interaction.options.getString("from") || "auto";

    if (!text) {
      return interaction.followUp({
        embeds: [EmbedUtils.error("Please provide valid text to translate.")],
      });
    }

    try {
      const translated = await translateText(text, targetLang, sourceLang);
      const embed = buildTranslateEmbed(text, translated, sourceLang, targetLang, interaction.user);
      return interaction.followUp({ embeds: [embed] });
    } catch (error) {
      return interaction.followUp({
        embeds: [EmbedUtils.error(`Translation failed: ${error.message}`)],
      });
    }
  },
};

async function translateText(text, targetLang, sourceLang) {
  try {
    // Using PopCat API for translation
    const url = `https://api.popcat.xyz/v2/translate?to=${targetLang}&text=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.error && data.message && data.message.translated) {
      return data.message.translated;
    } else {
      throw new Error("Translation API returned an error");
    }
  } catch (error) {
    throw new Error("Failed to translate text. Please try again.");
  }
}

function buildTranslateEmbed(original, translated, sourceLang, targetLang, user) {
  const sourceDisplay = LANGUAGE_CODES[sourceLang] || sourceLang.toUpperCase();
  const targetDisplay = LANGUAGE_CODES[targetLang] || targetLang.toUpperCase();

  return EmbedUtils.embed()
    .setColor(0x5865f2)
    .setTitle("🌐 Translation")
    .addFields(
      {
        name: `🔤 ${sourceDisplay}`,
        value: original.length > 1024 ? original.substring(0, 1021) + "..." : original,
        inline: false,
      },
      {
        name: `➡️ ${targetDisplay}`,
        value: translated.length > 1024 ? translated.substring(0, 1021) + "..." : translated,
        inline: false,
      }
    )
    .setFooter({
      text: `Requested by ${user.username}`,
      iconURL: user.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();
}

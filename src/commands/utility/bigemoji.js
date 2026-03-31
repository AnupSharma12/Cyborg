const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const CUSTOM_EMOJI_REGEX = /<(a)?:([a-zA-Z0-9_]+):(\d+)>/;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bigemoji",
  description: "Enlarge a custom or unicode emoji",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<emoji>",
    minArgsCount: 1,
    aliases: ["jumbo", "emoji"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "emoji",
        description: "The emoji to enlarge (custom or unicode)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const input = args.join(" ").trim();
    const parsed = parseEmoji(input);

    if (!parsed) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide a valid emoji. Example: `:smile:` custom emoji or 😀")],
      });
    }

    const embed = buildEmojiEmbed(parsed, message.client.user.displayAvatarURL());
    return message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const input = interaction.options.getString("emoji", true).trim();
    const parsed = parseEmoji(input);

    if (!parsed) {
      return interaction.followUp({
        embeds: [EmbedUtils.error("Please provide a valid emoji. Example: `<:name:id>` or 😀")],
      });
    }

    const embed = buildEmojiEmbed(parsed, interaction.client.user.displayAvatarURL());
    return interaction.followUp({ embeds: [embed] });
  },
};

function parseEmoji(input) {
  const customMatch = input.match(CUSTOM_EMOJI_REGEX);
  if (customMatch) {
    const isAnimated = Boolean(customMatch[1]);
    const name = customMatch[2];
    const id = customMatch[3];
    const extension = isAnimated ? "gif" : "png";

    return {
      type: "custom",
      display: customMatch[0],
      name,
      url: `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096&quality=lossless`,
      animated: isAnimated,
    };
  }

  // Treat remaining input as unicode emoji candidate
  const normalized = input.replace(/\s+/g, "").trim();
  if (!normalized) return null;

  const codePoints = Array.from(normalized, (char) => char.codePointAt(0).toString(16)).join("-");

  // If code points are plain ASCII letters/numbers, it's likely not an emoji
  if (/^[0-9a-z\-]+$/i.test(codePoints) && normalized.length === 1 && /[a-z0-9]/i.test(normalized)) {
    return null;
  }

  return {
    type: "unicode",
    display: normalized,
    name: "Unicode Emoji",
    url: `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoints}.png`,
    animated: false,
  };
}

function buildEmojiEmbed(data, iconURL) {
  return EmbedUtils.embed()
    .setAuthor({ name: "Big Emoji", iconURL })
    .setTitle(`${data.display} ${data.name}`)
    .setImage(data.url)
    .addFields(
      { name: "Type", value: `\`${data.type}\``, inline: true },
      { name: "Animated", value: `\`${data.animated ? "Yes" : "No"}\``, inline: true },
      { name: "Direct URL", value: `[Open Image](${data.url})`, inline: false }
    );
}

const { ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const SRA_BASE = "https://some-random-api.com/canvas";
const POPCAT_BASE = "https://api.popcat.xyz";

/**
 * Resolve an image URL from a message (mention > attachment > link arg > author avatar)
 */
function getImageFromMessage(message, args) {
  const mentioned = message.mentions.users.first();
  if (mentioned) return mentioned.displayAvatarURL({ size: 256, extension: "png" });

  const attachment = message.attachments.first();
  if (attachment && attachment.contentType?.startsWith("image/")) return attachment.url;

  const link = args.find((a) => a.startsWith("http"));
  if (link) return link;

  return message.author.displayAvatarURL({ size: 256, extension: "png" });
}

/**
 * Fetch a processed image buffer from an API
 */
async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Build full API URL for an image effect
 */
function buildApiUrl(apiPath, imageUrl) {
  // some-random-api paths use "avatar" param, popcat uses "image" param
  if (apiPath.startsWith("popcat:")) {
    const endpoint = apiPath.slice(7);
    return `${POPCAT_BASE}/${endpoint}?image=${encodeURIComponent(imageUrl)}`;
  }
  return `${SRA_BASE}/${apiPath}?avatar=${encodeURIComponent(imageUrl)}`;
}

/**
 * Factory: create a standalone image command module
 */
function createImageCommand(name, description, apiPath) {
  return {
    name,
    description,
    category: "FUN",
    cooldown: 5,
    botPermissions: ["EmbedLinks", "AttachFiles"],
    command: {
      enabled: true,
      usage: "[@user | image-link]",
    },
    slashCommand: {
      enabled: true,
      options: [
        {
          name: "user",
          description: "Apply effect to this user's avatar",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
        {
          name: "link",
          description: "Apply effect to this image URL",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },

    async messageRun(message, args) {
      const imageUrl = getImageFromMessage(message, args);
      const buffer = await fetchImageBuffer(buildApiUrl(apiPath, imageUrl));
      if (!buffer) return message.reply({ embeds: [EmbedUtils.error("Failed to generate image. Try again!")] });

      const attachment = new AttachmentBuilder(buffer, { name: "image.png" });
      const embed = EmbedUtils.embed()
        .setImage("attachment://image.png")
        .setFooter({ text: `Requested by ${message.author.username}` })
        .setColor("Random");
      return message.reply({ embeds: [embed], files: [attachment] });
    },

    async interactionRun(interaction) {
      const user = interaction.options.getUser("user");
      const link = interaction.options.getString("link");

      let imageUrl;
      if (user) imageUrl = user.displayAvatarURL({ size: 256, extension: "png" });
      else if (link) imageUrl = link;
      else imageUrl = interaction.user.displayAvatarURL({ size: 256, extension: "png" });

      const buffer = await fetchImageBuffer(buildApiUrl(apiPath, imageUrl));
      if (!buffer) return interaction.followUp({ embeds: [EmbedUtils.error("Failed to generate image. Try again!")] });

      const attachment = new AttachmentBuilder(buffer, { name: "image.png" });
      const embed = EmbedUtils.embed()
        .setImage("attachment://image.png")
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setColor("Random");
      await interaction.followUp({ embeds: [embed], files: [attachment] });
    },
  };
}

module.exports = { createImageCommand, getImageFromMessage, fetchImageBuffer, buildApiUrl };

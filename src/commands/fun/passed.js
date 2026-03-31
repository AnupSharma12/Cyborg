const { ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const API_URL = "https://some-random-api.com/canvas/overlay/passed";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "passed",
  description: "Apply a mission passed overlay",
  category: "IMAGE",
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
        description: "Apply the effect to this user's avatar",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "link",
        description: "Apply the effect to this image URL",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const imageUrl = getImageFromMessage(message, args);
    const url = `${API_URL}?avatar=${encodeURIComponent(imageUrl.split("?")[0])}`;

    const buffer = await fetchImage(url);
    if (!buffer) return message.reply({ embeds: [EmbedUtils.error("Failed to generate image. Try again!")] });

    const attachment = new AttachmentBuilder(buffer, { name: "passed.png" });
    const embed = EmbedUtils.embed()
      .setTitle("Mission Passed")
      .setImage("attachment://passed.png")
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

    const url = `${API_URL}?avatar=${encodeURIComponent(imageUrl.split("?")[0])}`;

    const buffer = await fetchImage(url);
    if (!buffer) return interaction.followUp({ embeds: [EmbedUtils.error("Failed to generate image. Try again!")] });

    const attachment = new AttachmentBuilder(buffer, { name: "passed.png" });
    const embed = EmbedUtils.embed()
      .setTitle("Mission Passed")
      .setImage("attachment://passed.png")
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setColor("Random");
    await interaction.followUp({ embeds: [embed], files: [attachment] });
  },
};

function getImageFromMessage(message, args) {
  const mentioned = message.mentions.users.first();
  if (mentioned) return mentioned.displayAvatarURL({ size: 256, extension: "png" });

  const att = message.attachments.first();
  if (att && att.contentType?.startsWith("image/")) return att.url;

  const link = args.find((a) => a.startsWith("http"));
  if (link) return link;

  return message.author.displayAvatarURL({ size: 256, extension: "png" });
}

async function fetchImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

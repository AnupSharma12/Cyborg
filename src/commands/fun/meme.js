const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

async function getRandomMeme(category) {
  const url = category
    ? `https://meme-api.com/gimme/${encodeURIComponent(category)}`
    : "https://meme-api.com/gimme";
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.url || json.code) {
      return EmbedUtils.error(`No meme found${category ? ` for \`${category}\`` : ""}. Try again!`);
    }
    if (json.nsfw) return await getRandomMeme(category); // skip NSFW, re-fetch
    return EmbedUtils.embed()
      .setAuthor({ name: json.title, url: json.postLink })
      .setImage(json.url)
      .setColor("Random")
      .setFooter({ text: `👍 ${json.ups} | r/${json.subreddit}` });
  } catch {
    return EmbedUtils.error("Failed to fetch meme. Try again!");
  }
}

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "meme",
  description: "Fetch a random meme from Reddit",
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  cooldown: 20,
  command: {
    enabled: true,
    usage: "[category]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "category",
        description: "Subreddit category to fetch memes from",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const choice = args[0] || null;
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("regenMemeBtn").setStyle(ButtonStyle.Secondary).setEmoji("🔁"),
    );

    const embed = await getRandomMeme(choice);
    const sent = await message.reply({ embeds: [embed], components: [buttonRow] });

    const collector = message.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && i.customId === "regenMemeBtn",
      time: 20_000,
      max: 3,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate().catch(() => {});
      const newEmbed = await getRandomMeme(choice);
      await sent.edit({ embeds: [newEmbed], components: [buttonRow] }).catch(() => {});
    });

    collector.on("end", () => {
      buttonRow.components.forEach((btn) => btn.setDisabled(true));
      sent.edit({ components: [buttonRow] }).catch(() => {});
    });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("category");
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("regenMemeBtn").setStyle(ButtonStyle.Secondary).setEmoji("🔁"),
    );

    const embed = await getRandomMeme(choice);
    await interaction.followUp({ embeds: [embed], components: [buttonRow] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id && i.customId === "regenMemeBtn",
      time: 20_000,
      max: 3,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate().catch(() => {});
      const newEmbed = await getRandomMeme(choice);
      await interaction.editReply({ embeds: [newEmbed], components: [buttonRow] }).catch(() => {});
    });

    collector.on("end", () => {
      buttonRow.components.forEach((btn) => btn.setDisabled(true));
      interaction.editReply({ components: [buttonRow] }).catch(() => {});
    });
  },
};

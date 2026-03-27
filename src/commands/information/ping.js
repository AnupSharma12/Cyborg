const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ping",
  description: "Shows the current ping from the bot to the discord servers",
  category: "INFORMATION",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const sent = await message.reply({ embeds: [EmbedUtils.embed().setDescription("\uD83C\uDFD3 Pinging...")] });
    const ping = sent.createdTimestamp - message.createdTimestamp;
    const apiPing = message.client.ws.ping;

    const embed = EmbedUtils.embed()
      .setAuthor({ name: "Pong!", iconURL: message.client.user.displayAvatarURL() })
      .addFields(
        { name: "Message Latency", value: `\`${ping}ms\``, inline: true },
        { name: "API Latency", value: `\`${apiPing}ms\``, inline: true },
        { name: "Uptime", value: `<t:${Math.floor((Date.now() - message.client.uptime) / 1000)}:R>`, inline: true },
      );

    await sent.edit({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const sent = await interaction.followUp({ content: "\uD83C\uDFD3 Pinging...", fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    const embed = EmbedUtils.embed()
      .setAuthor({ name: "Pong!", iconURL: interaction.client.user.displayAvatarURL() })
      .addFields(
        { name: "Message Latency", value: `\`${ping}ms\``, inline: true },
        { name: "API Latency", value: `\`${apiPing}ms\``, inline: true },
        { name: "Uptime", value: `<t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>`, inline: true },
      );

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};

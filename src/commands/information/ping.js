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
    const sent = await message.reply("🏓 Pinging...");
    const ping = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 Pong! \`${ping}ms\``);
  },

  async interactionRun(interaction) {
    const sent = await interaction.followUp({ content: "🏓 Pinging...", fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! \`${ping}ms\``);
  },
};

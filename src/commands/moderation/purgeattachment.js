const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purgeattachment",
  description: "Delete messages containing attachments",
  category: "MODERATION",
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "[amount]",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "amount",
        description: "Number of messages to scan (1-100, default 100)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 1,
        maxValue: 100,
      },
    ],
  },

  async messageRun(message, args) {
    const amount = parseInt(args[0]) || 100;
    if (amount < 1 || amount > 100) return message.reply("Amount must be between 1 and 100.");

    const response = await purgeAttachments(message.channel, amount);
    const reply = await message.channel.send(response);
    setTimeout(() => reply.delete().catch(() => null), 3000);
  },

  async interactionRun(interaction) {
    const amount = interaction.options.getInteger("amount") || 100;
    const response = await purgeAttachments(interaction.channel, amount);
    await interaction.followUp(response);
  },
};

async function purgeAttachments(channel, amount) {
  const messages = await channel.messages.fetch({ limit: amount }).catch(() => null);
  if (!messages) return "Failed to fetch messages.";

  const filtered = messages.filter((m) => m.attachments.size > 0);
  if (filtered.size === 0) return "No messages with attachments found.";

  const deleted = await channel.bulkDelete(filtered, true).catch(() => null);
  if (!deleted) return "Failed to delete messages.";
  return `Successfully deleted **${deleted.size}** message(s) containing attachments.`;
}

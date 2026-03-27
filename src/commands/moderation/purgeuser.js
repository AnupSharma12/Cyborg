const { ApplicationCommandOptionType } = require("discord.js");
const { success, error } = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purgeuser",
  description: "Delete messages from a specific user",
  category: "MODERATION",
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<@member|ID> [amount]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "user",
        description: "The user whose messages to delete",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
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
    const match = args[0].match(/(\d{17,20})/);
    if (!match) return message.reply("Please provide a valid member mention or ID.");

    const amount = parseInt(args[1]) || 100;
    if (amount < 1 || amount > 100) return message.reply("Amount must be between 1 and 100.");

    const response = await purgeUser(message.channel, match[1], amount);
    const reply = await message.channel.send({ embeds: [response] });
    setTimeout(() => reply.delete().catch(() => null), 3000);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount") || 100;
    const response = await purgeUser(interaction.channel, user.id, amount);
    await interaction.followUp({ embeds: [response] });
  },
};

async function purgeUser(channel, userId, amount) {
  const messages = await channel.messages.fetch({ limit: amount }).catch(() => null);
  if (!messages) return error("Failed to fetch messages.");

  const filtered = messages.filter((m) => m.author.id === userId);
  if (filtered.size === 0) return error("No messages found from that user.");

  const deleted = await channel.bulkDelete(filtered, true).catch(() => null);
  if (!deleted) return error("Failed to delete messages.");
  return success(`Deleted **${deleted.size}** message(s) from <@${userId}>`);
}

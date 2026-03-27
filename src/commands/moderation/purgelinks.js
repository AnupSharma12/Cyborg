const { ApplicationCommandOptionType } = require("discord.js");
const { success, error } = require("@helpers/EmbedUtils");

const URL_REGEX = /https?:\/\/[^\s]+/i;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purgelinks",
  description: "Delete messages containing links",
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

    const response = await purgeLinks(message.channel, amount);
    const reply = await message.channel.send({ embeds: [response] });
    setTimeout(() => reply.delete().catch(() => null), 3000);
  },

  async interactionRun(interaction) {
    const amount = interaction.options.getInteger("amount") || 100;
    const response = await purgeLinks(interaction.channel, amount);
    await interaction.followUp({ embeds: [response] });
  },
};

async function purgeLinks(channel, amount) {
  const messages = await channel.messages.fetch({ limit: amount }).catch(() => null);
  if (!messages) return error("Failed to fetch messages.");

  const filtered = messages.filter((m) => URL_REGEX.test(m.content));
  if (filtered.size === 0) return error("No messages with links found.");

  const deleted = await channel.bulkDelete(filtered, true).catch(() => null);
  if (!deleted) return error("Failed to delete messages.");
  return success(`Deleted **${deleted.size}** message(s) containing links`);
}

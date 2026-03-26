const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purge",
  description: "Delete a number of messages from a channel",
  category: "MODERATION",
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<amount>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "amount",
        description: "Number of messages to delete (1-100)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 1,
        maxValue: 100,
      },
    ],
  },

  async messageRun(message, args) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply("Please provide a number between 1 and 100.");
    }

    const response = await purge(message.channel, amount + 1); // +1 to include the command message
    const reply = await message.channel.send(response);
    setTimeout(() => reply.delete().catch(() => null), 3000);
  },

  async interactionRun(interaction) {
    const amount = interaction.options.getInteger("amount");
    const response = await purge(interaction.channel, amount);
    await interaction.followUp(response);
  },
};

async function purge(channel, amount) {
  const deleted = await channel.bulkDelete(amount, true).catch(() => null);
  if (!deleted) return "Failed to delete messages.";
  return `Successfully deleted **${deleted.size}** message(s).`;
}

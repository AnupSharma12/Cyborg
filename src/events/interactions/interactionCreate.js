const { commandHandler, contextHandler } = require("@src/handlers");
const { MessageFlags } = require("discord.js");

/**
 * @param {import("@src/structures").BotClient} client
 * @param {import("discord.js").BaseInteraction} interaction
 */
module.exports = async (client, interaction) => {
  if (!interaction.guild) {
    return interaction
      .reply({
        content: "Command can only be executed in a discord server",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {});
  }

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    await commandHandler.handleSlashCommand(interaction);
  }

  // Context Menu
  else if (interaction.isContextMenuCommand()) {
    const context = client.contextMenus.get(interaction.commandName);
    if (context) await contextHandler.handleContext(interaction, context);
    else
      return interaction
        .reply({
          content: "An error has occurred",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
  }
};

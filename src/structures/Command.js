/**
 * @typedef {Object} SubCommand
 * @property {string} trigger - subcommand invoke
 * @property {string} description - subcommand description
 */

/**
 * @typedef {Object} InteractionInfo
 * @property {boolean} enabled - Whether the slash command is enabled or not
 * @property {boolean} ephemeral - Whether the reply should be ephemeral
 * @property {import("discord.js").ApplicationCommandOptionData[]} options - command options
 */

/**
 * @typedef {Object} CommandInfo
 * @property {boolean} enabled - Whether the command is enabled or not
 * @property {string[]} [aliases] - Alternative names for the command (all must be lowercase)
 * @property {string} [usage=""] - The command usage format string
 * @property {number} [minArgsCount=0] - Minimum number of arguments the command takes
 * @property {SubCommand[]} [subcommands=[]] - List of subcommands
 */

/**
 * @typedef {Object} CommandData
 * @property {string} name - The name of the command (must be lowercase)
 * @property {string} description - A short description of the command
 * @property {number} cooldown - The command cooldown in seconds
 * @property {string} category - The category this command belongs to
 * @property {import("discord.js").PermissionResolvable[]} [botPermissions] - Permissions required by the client
 * @property {import("discord.js").PermissionResolvable[]} [userPermissions] - Permissions required by the user
 * @property {CommandInfo} command - Prefix command configuration
 * @property {InteractionInfo} slashCommand - Slash command configuration
 * @property {function(import("discord.js").Message, string[], object)} messageRun - Callback for prefix commands
 * @property {function(import("discord.js").ChatInputCommandInteraction, object)} interactionRun - Callback for slash commands
 */

/**
 * Placeholder for command data
 * @type {CommandData}
 */
module.exports = {
  name: "",
  description: "",
  cooldown: 0,
  category: "NONE",
  botPermissions: [],
  userPermissions: [],
  command: {
    enabled: true,
    aliases: [],
    usage: "",
    minArgsCount: 0,
    subcommands: [],
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },
  messageRun: (message, args, data) => {},
  interactionRun: (interaction, data) => {},
};

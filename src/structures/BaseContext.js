/**
 * @typedef {Object} ContextData
 * @property {string} name - The name of the context (must be lowercase)
 * @property {string} description - A short description of the context
 * @property {import("discord.js").ApplicationCommandType} type - The type (User or Message)
 * @property {boolean} [enabled] - Whether the context is enabled
 * @property {boolean} [ephemeral] - Whether the reply should be ephemeral
 * @property {import("discord.js").PermissionResolvable[]} [userPermissions] - Permissions required by the user
 * @property {number} [cooldown] - Cooldown in seconds
 * @property {function(import("discord.js").ContextMenuCommandInteraction)} run - The callback
 */

/**
 * @type {ContextData}
 */
module.exports = {
  name: "",
  description: "",
  type: "",
  enabled: false,
  ephemeral: false,
  userPermissions: [],
  cooldown: 0,
};

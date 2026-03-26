const { log, warn, error } = require("./Logger");
const { ApplicationCommandType } = require("discord.js");

module.exports = class Validator {
  static validateConfiguration() {
    log("Validating config file and environment variables");

    if (!process.env.DISCORD_TOKEN) {
      error("env: DISCORD_TOKEN cannot be empty");
      process.exit(1);
    }

    const config = require("@root/config");
    if (config.OWNER_IDS.length === 0) warn("config.js: OWNER_IDS are empty");
    if (!config.SUPPORT_SERVER) warn("config.js: SUPPORT_SERVER is not provided");
  }

  /**
   * @param {import("@structures/Command")} cmd
   */
  static validateCommand(cmd) {
    if (typeof cmd !== "object") {
      throw new TypeError("Command data must be an Object.");
    }
    if (typeof cmd.name !== "string" || cmd.name !== cmd.name.toLowerCase()) {
      throw new Error("Command name must be a lowercase string.");
    }
    if (typeof cmd.description !== "string") {
      throw new TypeError("Command description must be a string.");
    }
    if (cmd.cooldown && typeof cmd.cooldown !== "number") {
      throw new TypeError("Command cooldown must be a number");
    }

    // Validate prefix command details
    if (cmd.command) {
      if (typeof cmd.command !== "object") {
        throw new TypeError("Command.command must be an object");
      }
      if (
        cmd.command.aliases &&
        (!Array.isArray(cmd.command.aliases) ||
          cmd.command.aliases.some(
            (ali) => typeof ali !== "string" || ali !== ali.toLowerCase()
          ))
      ) {
        throw new TypeError(
          "Command.command aliases must be an Array of lowercase strings."
        );
      }
      if (cmd.command.enabled && typeof cmd.messageRun !== "function") {
        throw new TypeError("Missing 'messageRun' function");
      }
    }

    // Validate slash command details
    if (cmd.slashCommand) {
      if (typeof cmd.slashCommand !== "object") {
        throw new TypeError("Command.slashCommand must be an object");
      }
      if (
        cmd.slashCommand.options &&
        !Array.isArray(cmd.slashCommand.options)
      ) {
        throw new TypeError("Command.slashCommand options must be an array");
      }
      if (cmd.slashCommand.enabled && typeof cmd.interactionRun !== "function") {
        throw new TypeError("Missing 'interactionRun' function");
      }
    }
  }

  /**
   * @param {import("@structures/BaseContext")} context
   */
  static validateContext(context) {
    if (typeof context !== "object") {
      throw new TypeError("Context must be an object");
    }
    if (
      typeof context.name !== "string" ||
      context.name !== context.name.toLowerCase()
    ) {
      throw new Error("Context name must be a lowercase string.");
    }
    if (typeof context.description !== "string") {
      throw new TypeError("Context description must be a string.");
    }
    if (
      context.type !== ApplicationCommandType.User &&
      context.type !== ApplicationCommandType.Message
    ) {
      throw new TypeError("Context type must be either User or Message.");
    }
  }
};

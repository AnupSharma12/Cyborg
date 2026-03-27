const {
  Client,
  Collection,
  GatewayIntentBits,
  ApplicationCommandType,
} = require("discord.js");
const path = require("path");
const Logger = require("../helpers/Logger");
const { recursiveReadDirSync } = require("../helpers/Utils");
const { validateCommand, validateContext } = require("../helpers/Validator");
const CommandCategory = require("./CommandCategory");

module.exports = class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
      ],
      allowedMentions: {
        repliedUser: false,
      },
    });

    this.config = require("@root/config");

    /** @type {import("@structures/Command")[]} */
    this.commands = [];
    this.commandIndex = new Collection();

    /** @type {Collection<string, import("@structures/Command")>} */
    this.slashCommands = new Collection();

    /** @type {Collection<string, import("@structures/BaseContext")>} */
    this.contextMenus = new Collection();

    this.logger = Logger;
  }

  /**
   * Load all events from the specified directory
   * @param {string} directory
   */
  loadEvents(directory) {
    this.logger.log("Loading events...");
    let success = 0;
    let failed = 0;

    recursiveReadDirSync(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const eventName = path.basename(file, ".js");
        const event = require(filePath);
        this.on(eventName, event.bind(null, this));
        delete require.cache[require.resolve(filePath)];
        success += 1;
      } catch (ex) {
        failed += 1;
        this.logger.error(`Failed to load event - ${file}`, ex);
      }
    });

    this.logger.log(
      `Loaded ${success + failed} events. Success (${success}) Failed (${failed})`
    );
  }

  /**
   * Find command matching the invoke
   * @param {string} invoke
   * @returns {import("@structures/Command")|undefined}
   */
  getCommand(invoke) {
    const index = this.commandIndex.get(invoke.toLowerCase());
    return index !== undefined ? this.commands[index] : undefined;
  }

  /**
   * Register command file in the client
   * @param {import("@structures/Command")} cmd
   */
  loadCommand(cmd) {
    if (cmd.category && CommandCategory[cmd.category]?.enabled === false) {
      this.logger.debug(
        `Skipping Command ${cmd.name}. Category ${cmd.category} is disabled`
      );
      return;
    }

    // Prefix Command
    if (cmd.command?.enabled) {
      const index = this.commands.length;
      if (this.commandIndex.has(cmd.name)) {
        throw new Error(`Command ${cmd.name} already registered`);
      }
      if (Array.isArray(cmd.command.aliases)) {
        cmd.command.aliases.forEach((alias) => {
          if (this.commandIndex.has(alias))
            throw new Error(`Alias ${alias} already registered`);
          this.commandIndex.set(alias.toLowerCase(), index);
        });
      }
      this.commandIndex.set(cmd.name.toLowerCase(), index);
      this.commands.push(cmd);
    }

    // Slash Command
    if (cmd.slashCommand?.enabled) {
      if (this.slashCommands.has(cmd.name))
        throw new Error(`Slash Command ${cmd.name} already registered`);
      this.slashCommands.set(cmd.name, cmd);
    }
  }

  /**
   * Load all commands from the specified directory
   * @param {string} directory
   */
  loadCommands(directory) {
    this.logger.log("Loading commands...");
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const cmd = require(file);
        if (cmd === null || typeof cmd !== "object") continue;
        validateCommand(cmd);
        this.loadCommand(cmd);
      } catch (ex) {
        this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
      }
    }

    this.logger.success(`Loaded ${this.commands.length} commands`);
    this.logger.success(`Loaded ${this.slashCommands.size} slash commands`);
    if (this.slashCommands.size > 100)
      throw new Error("A maximum of 100 slash commands can be enabled");
  }

  /**
   * Load all contexts from the specified directory
   * @param {string} directory
   */
  loadContexts(directory) {
    this.logger.log("Loading contexts...");
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const ctx = require(file);
        if (ctx === null || typeof ctx !== "object") continue;
        validateContext(ctx);
        if (!ctx.enabled)
          return this.logger.debug(`Skipping context ${ctx.name}. Disabled!`);
        if (this.contextMenus.has(ctx.name))
          throw new Error(`Context already exists with that name`);
        this.contextMenus.set(ctx.name, ctx);
      } catch (ex) {
        this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
      }
    }

    const userContexts = this.contextMenus.filter(
      (ctx) => ctx.type === ApplicationCommandType.User
    ).size;
    const messageContexts = this.contextMenus.filter(
      (ctx) => ctx.type === ApplicationCommandType.Message
    ).size;

    this.logger.success(`Loaded ${userContexts} USER contexts`);
    this.logger.success(`Loaded ${messageContexts} MESSAGE contexts`);
  }

  /**
   * Register slash commands and context menus on startup
   * @param {string} [guildId]
   */
  async registerInteractions(guildId) {
    const toRegister = [];

    if (this.config.INTERACTIONS.SLASH) {
      this.slashCommands
        .map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
        }))
        .forEach((s) => toRegister.push(s));
    }

    if (this.config.INTERACTIONS.CONTEXT) {
      this.contextMenus
        .map((ctx) => ({
          name: ctx.name,
          type: ctx.type,
        }))
        .forEach((c) => toRegister.push(c));
    }

    if (!guildId) {
      await this.application.commands.set(toRegister);
    } else if (guildId && typeof guildId === "string") {
      const guild = this.guilds.cache.get(guildId);
      if (!guild) {
        this.logger.error(
          `Failed to register interactions in guild ${guildId}`
        );
        return;
      }
      await guild.commands.set(toRegister);
    }

    this.logger.success("Successfully registered interactions");
  }
};

# Cyborg

A powerful, fully configurable **Discord** bot built with discord.js v14.

## Features

- **Slash commands + prefix commands** — both work out of the box, independently toggleable
- **Context menu commands** — right-click user/message actions
- **Fully configurable** — credentials in `.env`, bot settings in `config.js`
- **Auto-loading** — commands, events, and contexts are auto-discovered from their directories
- **Modular architecture** — OOP structures, handlers, events, module aliases

## Project Structure

```
Cyborg/
├── bot.js                         # Entry point
├── config.js                      # Bot settings (prefix, toggles, owner IDs)
├── jsconfig.json                  # Module aliases for IDE support
├── .env                           # Credentials (git-ignored)
├── .env.example                   # Template for .env
├── package.json
├── .gitignore
└── src/
    ├── commands/                  # Bot commands (organized by category)
    │   └── information/
    │       └── ping.js
    ├── contexts/                  # Context menu commands (right-click)
    ├── database/                  # Database schemas and connection
    ├── events/                    # Discord.js event handlers
    │   ├── clientReady.js
    │   ├── interactions/
    │   │   └── interactionCreate.js
    │   └── message/
    │       └── messageCreate.js
    ├── handlers/                  # Command & context execution logic
    │   ├── command.js
    │   ├── context.js
    │   └── index.js
    ├── helpers/                   # Utilities, logger, validator
    │   ├── Logger.js
    │   ├── Utils.js
    │   └── Validator.js
    ├── services/                  # External service integrations
    └── structures/                # Core bot classes and templates
        ├── BotClient.js
        ├── Command.js
        ├── BaseContext.js
        ├── CommandCategory.js
        └── index.js
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your **credentials**:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Discord bot token |
| `DISCORD_CLIENT_ID` | Discord application client ID |

Edit `config.js` for **bot settings**:

| Field | Description |
|---|---|
| `OWNER_IDS` | Array of bot owner Discord user IDs |
| `SUPPORT_SERVER` | Invite link to your support server |
| `PREFIX_COMMANDS.ENABLED` | `true` / `false` — toggle prefix commands |
| `PREFIX_COMMANDS.DEFAULT_PREFIX` | Prefix for text commands (default `!`) |
| `INTERACTIONS.SLASH` | `true` / `false` — toggle slash commands |
| `INTERACTIONS.CONTEXT` | `true` / `false` — toggle context menus |
| `INTERACTIONS.GLOBAL` | `true` = register globally, `false` = guild-only (for testing) |
| `INTERACTIONS.TEST_GUILD_ID` | Guild ID for dev-mode commands (used when `GLOBAL` is `false`) |

### 3. Start the bot

```bash
npm start
```

Slash commands and context menus are automatically registered on startup via `clientReady` event.

## Discord Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. Under **Bot**, click **Reset Token** and copy it → `DISCORD_TOKEN` in `.env`.
3. Copy the **Application ID** → `DISCORD_CLIENT_ID` in `.env`.
4. Enable **MESSAGE CONTENT INTENT** under **Bot → Privileged Gateway Intents** (required for prefix commands).
5. Invite the bot using OAuth2 → URL Generator with scopes `bot` + `applications.commands` and permissions: Send Messages, Read Message History.

## Adding New Commands

Create a new file in a category folder under `src/commands/` (e.g. `src/commands/fun/hello.js`):

```js
/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "hello",
  description: "Says hello!",
  category: "FUN",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
    options: [],
  },

  async messageRun(message, args) {
    await message.reply("Hello there!");
  },

  async interactionRun(interaction) {
    await interaction.followUp("Hello there!");
  },
};
```

Commands are auto-loaded from all subdirectories. No registration step needed — slash commands are registered when the bot starts.

## Module Aliases

Path aliases are available for cleaner imports:

| Alias | Path |
|---|---|
| `@root` | `.` (project root) |
| `@src` | `src/` |
| `@handlers` | `src/handlers/` |
| `@helpers` | `src/helpers/` |
| `@structures` | `src/structures/` |
| `@schemas` | `src/database/schemas/` |

## License

ISC

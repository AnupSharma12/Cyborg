<p align="center">
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/license-ISC-blue?style=for-the-badge" />
</p>

# Cyborg

A powerful, fully configurable **Discord moderation bot** built with discord.js v14. Comes with 23+ commands, rich embed responses, and both prefix & slash command support out of the box.

---

## Features

- **Dual Command System** — Slash commands + prefix commands, independently toggleable
- **23+ Commands** — Moderation, information, and utility commands ready to go
- **Rich Embeds** — Every response uses clean, color-coded embeds
- **Moderation Suite** — Kick, ban, softban, timeout, warn, purge, voice mod, nickname management
- **Voice Moderation** — Mute, deafen, disconnect, and move members across voice channels
- **Message Purge** — Bulk delete with filters: by user, bots only, links only, attachments only
- **Warning System** — File-based warning database with add, view, and tracking
- **Help System** — Dynamic help command with category listing and per-command details
- **Auto-loading** — Commands, events, and contexts are auto-discovered from directories
- **Rotating Status** — Cycles through activity messages showing live stats
- **Startup Banner** — Clean console banner on launch with server/command stats

## Commands

### Moderation (20)

| Command | Description |
|---------|-------------|
| `kick` | Kick a member from the server |
| `ban` | Ban a member from the server |
| `unban` | Unban a user by ID |
| `softban` | Ban and immediately unban to purge messages |
| `timeout` | Timeout a member for a duration |
| `untimeout` | Remove timeout from a member |
| `warn` | Issue a warning to a member |
| `warnings` | View warnings for a member |
| `nick` | Set or reset a member's nickname |
| `purge` | Bulk delete messages |
| `purgeuser` | Delete messages from a specific user |
| `purgebots` | Delete messages from bots |
| `purgelinks` | Delete messages containing links |
| `purgeattachment` | Delete messages with attachments |
| `vmute` | Server mute a member in voice |
| `vunmute` | Unmute a member in voice |
| `deafen` | Server deafen a member in voice |
| `undeafen` | Undeafen a member in voice |
| `disconnect` | Disconnect a member from voice |
| `move` | Move a member to another voice channel |

### Information (3)

| Command | Description |
|---------|-------------|
| `help` | View all commands or get details on a specific command |
| `ping` | Check bot latency and uptime |
| `botinfo` | View bot statistics, version, and system info |

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Discord Bot Token](https://discord.com/developers/applications)

### Installation

```bash
# Clone the repository
git clone https://github.com/AnupSharma12/Cyborg.git
cd Cyborg

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

### Configuration

1. **`.env`** — Add your bot token:
   ```env
   BOT_TOKEN=your_bot_token_here
   ```

2. **`config.js`** — Customize bot settings:
   ```js
   module.exports = {
     OWNER_IDS: ['your_user_id'],
     PREFIX_COMMANDS: {
       ENABLED: true,
       DEFAULT_PREFIX: '!',
     },
     INTERACTIONS: {
       SLASH: true,
       CONTEXT: true,
       GLOBAL: false,                    // Set true for production
       TEST_GUILD_ID: 'your_guild_id',  // For development testing
     },
   };
   ```

### Running

```bash
# Start the bot
node bot.js
```

### Required Bot Permissions

When inviting the bot, ensure these permissions are granted:

- `Manage Messages` — Purge commands
- `Kick Members` — Kick command
- `Ban Members` — Ban, unban, softban commands
- `Moderate Members` — Timeout commands
- `Manage Nicknames` — Nick command
- `Mute Members` — Voice mute commands
- `Deafen Members` — Voice deafen commands
- `Move Members` — Voice move and disconnect commands

### Required Intents

Enable these in the [Discord Developer Portal](https://discord.com/developers/applications):

- **Server Members Intent** — For member-related commands
- **Message Content Intent** — For prefix commands

## Project Structure

```
Cyborg/
├── bot.js                         # Entry point
├── config.js                      # Bot settings
├── .env                           # Credentials (git-ignored)
└── src/
    ├── commands/                  # Bot commands (by category)
    │   ├── information/           # help, ping, botinfo
    │   └── moderation/            # All moderation commands
    ├── contexts/                  # Context menu commands
    ├── database/                  # Warning system database
    ├── events/                    # Discord.js event handlers
    ├── handlers/                  # Command execution logic
    ├── helpers/                   # EmbedUtils, Logger, Validator
    └── structures/                # Core classes (BotClient, Command)
```

## Tech Stack

- **Runtime:** Node.js
- **Library:** discord.js v14
- **Architecture:** CommonJS modules with module-alias
- **Database:** File-based JSON (warnings)

---

<p align="center">Made with ❤️ by <b>Anup Sharma</b></p>
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

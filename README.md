<p align="center">
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/commands-94+-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-ISC-blue?style=for-the-badge" />
</p>

# Cyborg Bot

A feature-rich, fully configurable **Discord bot** built with discord.js v14. Packed with **94+ commands** across multiple categories including moderation, music, fun, anime reactions, giveaways, and more. Supports both slash commands and prefix commands out of the box.

**🎵 Music System:** Full YouTube streaming with yt-dlp, cookie authentication, and FFmpeg transcoding.

---

## ✨ Features

- **Dual Command System** — Slash commands + prefix commands, independently toggleable
- **94+ Commands** — Moderation, music, fun, anime, image, giveaways, and more
- **🎵 Full Music System** — YouTube streaming with yt-dlp, Opus codec, FFmpeg transcoding
  - 12 music commands: play, queue, skip, pause, resume, stop, loop, shuffle, clear, volume, leave, nowplaying
  - Cookie-based authentication for better YouTube access
  - Fallback to play-dl library on bot detection
  - Interactive controller with buttons for playback control
- **Interactive Help Menu** — Category select dropdown with paginated command browsing
- **Rich Embeds** — Every response uses clean, color-coded embeds
- **Moderation Suite** — Ban, kick, softban, timeout, warn, purge, voice moderation
- **Image Manipulation** — Filters, generators, and overlays
- **Anime Reactions** — GIF reaction commands for social interaction
- **Fun Commands** — Games, facts, memes, and more
- **Giveaways System** — Full giveaway management
- **Warning System** — Database with add and view capabilities
- **Webhook Logging** — Error and guild join/leave notifications
- **Rotating Status** — Live stats (servers, users, commands)
- **Category System** — Enable/disable entire categories
- **Cooldown System** — Owner bypass option
- **Auto-loading** — Discord.js best practices

---

## 📋 Quick Start

### Prerequisites
- Node.js 18+ (v24.14.1 recommended)
- npm or yarn
- Discord Bot Token
- FFmpeg (auto-bundled via ffmpeg-static)
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

### 😂 Fun (7)

| Command | Description |
|---------|-------------|
| `flip` | Flip a coin or flip text upside down |
| `meme` | Fetch random memes from Reddit |
| `wyr` | Would You Rather questions with voting |
| `hack` | Fake hacking simulation animation |
| `animal` | Random animal pictures and facts |
| `facts` | Random interesting facts |
| `pickupline` | Random pickup lines |

### 💮 Anime (10)

| Command | Description |
|---------|-------------|
| `hug` | Hug someone with an anime GIF |
| `kiss` | Kiss someone |
| `slap` | Slap someone |
| `pat` | Pat someone |
| `cuddle` | Cuddle someone |
| `poke` | Poke someone |
| `tickle` | Tickle someone |
| `feed` | Feed someone |
| `smug` | Show a smug face |
| `wink` | Wink at everyone |

### 🖼️ Image (28)

**Filters (11):** `blur`, `brighten`, `burn`, `darken`, `distort`, `greyscale`, `invert`, `pixelate`, `sepia`, `sharpen`, `threshold`

**Generators (10):** `ad`, `beautiful`, `jokeoverhead`, `wanted`, `circle`, `heart`, `lolice`, `its-so-stupid`, `horny`, `simpcard`

**Overlays (7):** `wasted`, `jail`, `gay`, `passed`, `triggered`, `comrade`, `glass`

---

## 🚀 Installation & Deployment

### Local Development

```bash
# Clone repo
git clone https://github.com/AnupSharma12/Cyborg.git
cd Cyborg

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your bot token
# DISCORD_TOKEN=your_token_here
# DISCORD_CLIENT_ID=your_client_id_here

# Start bot
npm start

# For development with auto-reload
npm run dev
```

### Production Deployment

#### Using Pterodactyl Panel (recommended):
1. Create a new egg/instance
2. Set **Start Command**: `npm install && npm start`
3. Set **Java/Node Version**: Node.js 18+ (v24 recommended)
4. Set **Memory**: 256MB minimum, 512MB+ recommended
5. Add environment variables from `.env`

#### Using Railway/Render:
1. Connect your GitHub repo
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `npm start`
4. Add secrets for `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`

#### Using Docker:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

### Music Setup (Optional)

For YouTube streaming, add cookies for better access:

**Using Netscape Format (.txt):**
Export from your browser using a cookie extension and save as `cookies.txt` in the project root.

**Using Chrome Export (.json):**
Export cookies as JSON and save as `cookies.json` in the project root.

The bot will auto-detect and use cookies from: `cookies.txt`, `cookies.json`, `youtube_cookies.txt`, `youtube_cookies.json`

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Discord Bot Token](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/AnupSharma12/Cyborg.git
cd Cyborg
npm install
cp .env.example .env
```

### Configuration

**`.env`** — Add your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Optional webhook logging
ERROR_LOG_WEBHOOK=your_error_webhook_url
GUILD_LOG_WEBHOOK=your_guild_webhook_url
```

**`config.js`** — Customize bot behavior:
```js
module.exports = {
  OWNER_IDS: ['your_user_id'],
  SUPPORT_SERVER: 'https://discord.gg/your-server',
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
  PRESENCE: {
    ENABLED: true,
    STATUS: 'online',                 // online | idle | dnd | invisible
    ACTIVITIES: [
      { name: '/help', type: 'LISTENING' },
      { name: '{servers} servers', type: 'WATCHING' },
      { name: '{users} users', type: 'WATCHING' },
    ],
    INTERVAL: 30,                     // Rotation interval in seconds
  },
  COOLDOWN: {
    DEFAULT: 5,                       // Default cooldown in seconds
    OWNER_BYPASS: true,               // Owners skip cooldowns
  },
  CATEGORIES: {                       // Enable/disable command categories
    ADMIN: { enabled: true },
    INFORMATION: { enabled: true },
    FUN: { enabled: true },
    IMAGE: { enabled: true },
    ANIME: { enabled: true },
    MODERATION: { enabled: true },
    OWNER: { enabled: true },
    UTILITY: { enabled: true },
  },
};
```

### Running

```bash
npm start
```

Slash commands are automatically registered on startup.

### Required Bot Permissions

- Manage Messages, Kick Members, Ban Members, Moderate Members
- Manage Nicknames, Mute Members, Deafen Members, Move Members
- Embed Links, Attach Files

### Required Intents

Enable in the [Discord Developer Portal](https://discord.com/developers/applications):

- **Server Members Intent**
- **Message Content Intent**

---

## Project Structure

```
Cyborg/
├── bot.js                         # Entry point
├── config.js                      # Bot configuration
├── .env                           # Credentials (git-ignored)
└── src/
    ├── commands/
    │   ├── information/           # help, ping, botinfo
    │   ├── moderation/            # 20 moderation commands
    │   └── fun/                   # fun, anime, image commands
    ├── contexts/                  # Context menu commands
    ├── database/                  # Warning system
    ├── events/                    # Discord.js event handlers
    ├── handlers/                  # Command & context execution
    ├── helpers/                   # EmbedUtils, Logger, Validator, WebhookLogger
    └── structures/                # BotClient, Command, CommandCategory
```

## Adding Commands

Create a file in any `src/commands/` subdirectory:

```js
module.exports = {
  name: "hello",
  description: "Says hello!",
  category: "FUN",
  cooldown: 5,
  command: { enabled: true },
  slashCommand: { enabled: true, options: [] },

  async messageRun(message, args) {
    await message.reply("Hello there!");
  },

  async interactionRun(interaction) {
    await interaction.followUp("Hello there!");
  },
};
```

Commands are auto-loaded on startup. No manual registration needed.

## Tech Stack

- **Runtime:** Node.js
- **Library:** discord.js v14
- **Architecture:** CommonJS with module-alias
- **Database:** File-based JSON

---

<p align="center">Made with ❤️ by <b>Anup Sharma</b></p>
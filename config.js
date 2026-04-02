module.exports = {
  OWNER_IDS: ['1058571117322850395'], // Bot owner ID's
  SUPPORT_SERVER: 'https://discord.gg/discord', // Your bot support server
  PREFIX_COMMANDS: {
    ENABLED: true, // Enable/Disable prefix commands
    DEFAULT_PREFIX: '!', // Default prefix for the bot
  },
  INTERACTIONS: {
    SLASH: true, // Should the interactions be enabled
    CONTEXT: true, // Should contexts be enabled
    GLOBAL: false, // Should the interactions be registered globally
    TEST_GUILD_ID: '1362023048383037451', // Guild ID where the interactions should be registered. [** Test you commands here first **]
  },
  EMBED: {
    COLOR: 0x5865f2, // Default embed color (blurple)
    FOOTER: 'Cyborg Bot', // Default footer text
  },
  EMBED_COLORS: {
    BOT_EMBED: '#2B2D31',
    TRANSPARENT: '#2B2D31',
    SUCCESS: '#23A559',
    ERROR: '#ED4245',
    WARNING: '#F0B232',
    MUSIC: '#5865F2',
    INFO: '#5865F2',
    ECONOMY: '#F47B67',
    AUTOMOD: '#EB459E',
  },
  PRESENCE: {
    ENABLED: true, // Enable/Disable rotating presence
    STATUS: 'online', // online | idle | dnd | invisible
    ACTIVITIES: [
      { name: '/help', type: 'LISTENING' },
      { name: '{servers} servers', type: 'WATCHING' },
      { name: '{users} users', type: 'WATCHING' },
      { name: 'with moderation tools', type: 'PLAYING' },
      { name: '{commands} commands', type: 'LISTENING' },
    ],
    INTERVAL: 30, // Activity rotation interval in seconds
  },
  COOLDOWN: {
    DEFAULT: 5, // Default cooldown in seconds for commands without one
    OWNER_BYPASS: true, // Whether owners bypass cooldowns
  },
  CATEGORIES: {
    ADMIN: { enabled: true },
    INFORMATION: { enabled: true },
    FUN: { enabled: true },
    IMAGE: { enabled: true },
    ANIME: { enabled: true },
    MUSIC: { enabled: true },
    MODERATION: { enabled: true },
    AUTOMOD: { enabled: true },
    GIVEAWAY: { enabled: true },
    OWNER: { enabled: true },
    UTILITY: { enabled: true },
    NONE: { enabled: true },
  },
  MUSIC: {
    ENABLED: true,
    IDLE_TIME: 60,
    DEFAULT_VOLUME: 80,
  },
  GIVEAWAYS: {
    ENABLED: true,
    REACTION: "🎁",
    START_EMBED: "#5865F2",
    END_EMBED: "#2B2D31",
  },
};

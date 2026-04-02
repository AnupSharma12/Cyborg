// Music manager for Cyborg bot
const MusicPlayer = require('@src/services/MusicPlayer');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.players = new Map();
    this.initialized = true;
    this.client.logger.success('Music system initialized');
  }

  async initialize() {
    // No async initialization needed
    return Promise.resolve();
  }

  getPlayer(guildId) {
    if (!this.players.has(guildId)) {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }
      this.players.set(guildId, new MusicPlayer(guild));
    }
    return this.players.get(guildId);
  }

  async createPlayer(options) {
    const { guild, voiceChannel, textChannel } = options;
    const player = this.getPlayer(guild.id);
    await player.connect(voiceChannel, textChannel);
    return player;
  }

  deletePlayer(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.disconnect();
      this.players.delete(guildId);
    }
  }

  sendRawData(data) {
    // Handle raw websocket data for voice connections
    // This is called by the raw event handler
    // Most implementations don't need to do anything here
    // as discord.js handles voice connections internally
  }

  init(options) {
    // Initialize the music manager with user options
    // This is called from the ready event
    this.initialized = true;
  }
}

module.exports = MusicManager;

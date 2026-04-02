const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const play = require('play-dl');
const { spawn, execSync } = require('child_process');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');
const path = require('path');
const os = require('os');

// Resolve yt-dlp binary path: ~/.local/bin → system PATH → bundled in youtube-dl-exec
const YTDLP_BIN = (() => {
  const fs = require('fs');
  // 1. Check pipx / local install
  const localBin = path.join(os.homedir(), '.local', 'bin', 'yt-dlp');
  try { fs.accessSync(localBin, fs.constants.X_OK); return localBin; } catch {}
  // 2. Check system PATH
  try { execSync('yt-dlp --version', { stdio: 'ignore' }); return 'yt-dlp'; } catch {}
  // 3. Fallback to bundled binary from youtube-dl-exec (works on any hosting)
  try {
    const { constants: c } = require('youtube-dl-exec');
    if (c.YOUTUBE_DL_PATH) { fs.accessSync(c.YOUTUBE_DL_PATH, fs.constants.X_OK); return c.YOUTUBE_DL_PATH; }
  } catch {}
  // Last resort — hope it's on PATH
  return 'yt-dlp';
})();

class MusicPlayer {
  constructor(guild) {
    this.guild = guild;
    this.queue = [];
    this.currentSong = null;
    this.voiceConnection = null;
    this.audioPlayer = null;
    this.volume = 80;
    this.loopMode = 'off'; // 'off', 'song', 'queue'
    this.isPlaying = false;
    this.textChannel = null;
    this.startedAt = null;
    this.ytdlpProcess = null;
    this.controllerMessage = null;
    this.controllerInterval = null;
  }

  async connect(voiceChannel, textChannel) {
    this.textChannel = textChannel;

    this.voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guild.id,
      adapterCreator: this.guild.voiceAdapterCreator,
    });

    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleSongEnd();
    });

    this.audioPlayer.on('error', error => {
      console.error('Audio player error:', error.message);
      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('`\u26a0` An error occurred during playback. Skipping...')
          .setFooter({ text: 'Cyborg Music' });
        this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
      this.handleSongEnd();
    });

    this.voiceConnection.subscribe(this.audioPlayer);

    try {
      await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30000);
      return true;
    } catch (error) {
      this.voiceConnection.destroy();
      throw error;
    }
  }

  async play(query, requestedBy = null) {
    const song = await this.searchSong(query);
    if (!song) {
      return { error: 'No results found for your query' };
    }

    song.requestedBy = requestedBy;
    this.queue.push(song);

    if (!this.isPlaying) {
      return this.playNext();
    }

    return { success: true, song, position: this.queue.length };
  }

  async searchSong(query) {
    try {
      // Check if it's a YouTube URL
      if (play.yt_validate(query) === 'video') {
        // Use yt-dlp to get video metadata (more reliable than play-dl video_info)
        const info = await this.getVideoInfo(query);
        if (info) return info;

        // Fallback to play-dl
        try {
          const pdInfo = await play.video_info(query);
          const details = pdInfo.video_details;
          return {
            title: details.title,
            url: details.url,
            duration: details.durationInSec,
            thumbnail: details.thumbnails?.[details.thumbnails.length - 1]?.url,
            author: details.channel?.name || 'Unknown',
            requestedBy: null,
          };
        } catch {
          return null;
        }
      }

      // Search YouTube using play-dl (search still works)
      const searchResults = await play.search(query, { limit: 1, source: { youtube: 'video' } });
      if (!searchResults || searchResults.length === 0) {
        // Fallback: use yt-dlp search
        return this.ytdlpSearch(query);
      }

      const video = searchResults[0];
      return {
        title: video.title,
        url: video.url,
        duration: video.durationInSec || 0,
        thumbnail: video.thumbnails?.[video.thumbnails.length - 1]?.url,
        author: video.channel?.name || 'Unknown',
        requestedBy: null,
      };
    } catch (error) {
      console.error('Search error:', error.message);
      // Fallback to yt-dlp search
      try {
        return await this.ytdlpSearch(query);
      } catch {
        return null;
      }
    }
  }

  /**
   * Get video info using yt-dlp (JSON metadata)
   */
  getVideoInfo(url) {
    return new Promise((resolve) => {
      const proc = spawn(YTDLP_BIN, [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        url,
      ]);

      let data = '';
      proc.stdout.on('data', chunk => { data += chunk; });
      proc.stderr.on('data', () => {}); // ignore stderr

      proc.on('close', (code) => {
        if (code !== 0 || !data) return resolve(null);
        try {
          const info = JSON.parse(data);
          resolve({
            title: info.title || 'Unknown',
            url: info.webpage_url || url,
            duration: info.duration || 0,
            thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || null,
            author: info.uploader || info.channel || 'Unknown',
            requestedBy: null,
          });
        } catch {
          resolve(null);
        }
      });

      proc.on('error', () => resolve(null));

      // Timeout after 10 seconds
      setTimeout(() => {
        proc.kill();
        resolve(null);
      }, 10000);
    });
  }

  /**
   * Search YouTube using yt-dlp (fallback)
   */
  ytdlpSearch(query) {
    return new Promise((resolve) => {
      const proc = spawn(YTDLP_BIN, [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--default-search', 'ytsearch',
        `ytsearch1:${query}`,
      ]);

      let data = '';
      proc.stdout.on('data', chunk => { data += chunk; });
      proc.stderr.on('data', () => {});

      proc.on('close', (code) => {
        if (code !== 0 || !data) return resolve(null);
        try {
          const info = JSON.parse(data);
          resolve({
            title: info.title || 'Unknown',
            url: info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`,
            duration: info.duration || 0,
            thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || null,
            author: info.uploader || info.channel || 'Unknown',
            requestedBy: null,
          });
        } catch {
          resolve(null);
        }
      });

      proc.on('error', () => resolve(null));

      setTimeout(() => {
        proc.kill();
        resolve(null);
      }, 15000);
    });
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentSong = null;
      this.startedAt = null;

      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription('`\ud83c\udfb5` Queue ended. Add more songs to keep the music going!')
          .setFooter({ text: 'Cyborg Music' });
        this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // Auto-leave after delay
      setTimeout(() => {
        if (!this.isPlaying && this.voiceConnection) {
          this.disconnect();
        }
      }, 60000);

      return { success: false, message: 'Queue is empty' };
    }

    this.currentSong = this.queue.shift();
    this.isPlaying = true;
    this.startedAt = Date.now();

    try {
      // Use yt-dlp to stream audio (play-dl streaming is broken)
      const stream = this.createYtdlpStream(this.currentSong.url);

      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });

      if (resource.volume) {
        resource.volume.setVolumeLogarithmic(this.volume / 100);
      }

      this.audioPlayer.play(resource);

      // Send now playing controller
      if (this.textChannel) {
        await this.sendController();
      }

      return { success: true, song: this.currentSong };
    } catch (error) {
      console.error('Play error:', error.message);
      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(`\`\u274c\` Failed to play: ${error.message}`)
          .setFooter({ text: 'Cyborg Music' });
        this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
      this.isPlaying = false;
      return this.playNext();
    }
  }

  /**
   * Create audio stream using yt-dlp (pipes audio to stdout)
   */
  createYtdlpStream(url) {
    // Kill previous yt-dlp process if still running
    if (this.ytdlpProcess) {
      this.ytdlpProcess.kill();
      this.ytdlpProcess = null;
    }

    this.ytdlpProcess = spawn(YTDLP_BIN, [
      '-f', 'bestaudio[acodec=opus]/bestaudio',
      '-o', '-',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      url,
    ]);

    this.ytdlpProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.error('yt-dlp stderr:', msg);
    });

    this.ytdlpProcess.on('error', (err) => {
      console.error('yt-dlp process error:', err.message);
    });

    this.ytdlpProcess.on('close', () => {
      this.ytdlpProcess = null;
    });

    return this.ytdlpProcess.stdout;
  }

  handleSongEnd() {
    if (this.loopMode === 'song' && this.currentSong) {
      this.queue.unshift(this.currentSong);
    } else if (this.loopMode === 'queue' && this.currentSong) {
      this.queue.push(this.currentSong);
    }

    this.playNext();
  }

  pause() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.audioPlayer) {
      this.audioPlayer.unpause();
      return true;
    }
    return false;
  }

  skip() {
    if (this.audioPlayer) {
      this.audioPlayer.stop();
      return true;
    }
    return false;
  }

  stop() {
    this.queue = [];
    if (this.audioPlayer) {
      this.audioPlayer.stop();
    }
    this.isPlaying = false;
    this.currentSong = null;
    this.startedAt = null;
    this.destroyController();
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  setVolume(volume) {
    this.volume = Math.max(1, Math.min(100, volume));
  }

  setLoopMode(mode) {
    if (['off', 'song', 'queue'].includes(mode)) {
      this.loopMode = mode;
      return true;
    }
    return false;
  }

  disconnect() {
    this.destroyController();
    this.stop();
    if (this.ytdlpProcess) {
      this.ytdlpProcess.kill();
      this.ytdlpProcess = null;
    }
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }
    if (this.audioPlayer) {
      this.audioPlayer.stop();
      this.audioPlayer = null;
    }
  }

  getQueue() {
    return {
      current: this.currentSong,
      upcoming: this.queue,
      isPlaying: this.isPlaying,
    };
  }

  createProgressBar(current, total) {
    if (!total || total === 0) return '\u25ac'.repeat(12);
    const percentage = Math.min(current / total, 1);
    const filled = Math.round(12 * percentage);
    const empty = 12 - filled;
    return '\u25ac'.repeat(filled) + '\ud83d\udd18' + '\u25ac'.repeat(empty);
  }

  formatDuration(seconds) {
    if (!seconds || seconds === 0) return 'LIVE';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════
  //         🎛️ MUSIC CONTROLLER SYSTEM
  // ═══════════════════════════════════════════

  /**
   * Build the now-playing embed with current state
   */
  buildNowPlayingEmbed() {
    if (!this.currentSong) return null;

    const elapsed = this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0;
    const total = this.currentSong.duration;
    const progressBar = this.createProgressBar(elapsed, total);
    const isPaused = this.audioPlayer?.state?.status === AudioPlayerStatus.Paused;

    const loopLabel = this.loopMode === 'song' ? '🔂 Song' : this.loopMode === 'queue' ? '🔁 Queue' : '▶️ Off';
    const statusIcon = isPaused ? '⏸️' : '🎶';

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.MUSIC || '#5865F2')
      .setAuthor({ name: `${statusIcon} Now Playing`, iconURL: 'https://cdn.discordapp.com/emojis/1145727546815590400.gif' })
      .setDescription(
        `### [\u200b${this.currentSong.title}](${this.currentSong.url})\n` +
        `${progressBar}\n` +
        `\`${this.formatDuration(elapsed)} / ${this.formatDuration(total)}\``
      )
      .setThumbnail(this.currentSong.thumbnail)
      .addFields(
        { name: '🎤 Artist', value: `\`${this.currentSong.author || 'Unknown'}\``, inline: true },
        { name: '📋 Queue', value: `\`${this.queue.length} track(s)\``, inline: true },
        { name: '🔊 Volume', value: this.getVolumeBar(), inline: true },
        { name: '🔁 Loop', value: `\`${loopLabel}\``, inline: true },
        { name: '👤 Requested by', value: this.currentSong.requestedBy ? `<@${this.currentSong.requestedBy}>` : '\`Unknown\`', inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      )
      .setFooter({ text: `Cyborg Music • Use the buttons below to control playback` })
      .setTimestamp();

    return embed;
  }

  /**
   * Build volume bar visual
   */
  getVolumeBar() {
    const blocks = 8;
    const filled = Math.round((this.volume / 100) * blocks);
    const empty = blocks - filled;
    const icon = this.volume === 0 ? '🔇' : this.volume < 30 ? '🔈' : this.volume < 70 ? '🔉' : '🔊';
    return `${icon} ${'█'.repeat(filled)}${'░'.repeat(empty)} \`${this.volume}%\``;
  }

  /**
   * Build button rows for the controller
   */
  buildControllerButtons() {
    const isPaused = this.audioPlayer?.state?.status === AudioPlayerStatus.Paused;

    // Row 1: Main playback controls
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('MUSIC_SHUFFLE')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(this.queue.length < 2),
      new ButtonBuilder()
        .setCustomId('MUSIC_PREV')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MUSIC_PAUSE_RESUME')
        .setEmoji(isPaused ? '▶️' : '⏸️')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('MUSIC_SKIP')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MUSIC_STOP')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
    );

    // Row 2: Extra controls
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('MUSIC_VOL_DOWN')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(this.volume <= 10),
      new ButtonBuilder()
        .setCustomId('MUSIC_VOL_UP')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(this.volume >= 100),
      new ButtonBuilder()
        .setCustomId('MUSIC_LOOP')
        .setEmoji(this.loopMode === 'song' ? '🔂' : this.loopMode === 'queue' ? '🔁' : '➡️')
        .setStyle(this.loopMode !== 'off' ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setLabel(this.loopMode === 'off' ? 'Loop' : this.loopMode === 'song' ? 'Song' : 'Queue'),
      new ButtonBuilder()
        .setCustomId('MUSIC_QUEUE')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`Queue (${this.queue.length})`),
      new ButtonBuilder()
        .setCustomId('MUSIC_LEAVE')
        .setEmoji('🚪')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Leave')
    );

    return [row1, row2];
  }

  /**
   * Build disabled buttons for when playback ends
   */
  buildDisabledButtons() {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('MUSIC_SHUFFLE').setEmoji('🔀').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_PREV').setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_PAUSE_RESUME').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_SKIP').setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_STOP').setEmoji('⏹️').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('MUSIC_VOL_DOWN').setEmoji('🔉').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_VOL_UP').setEmoji('🔊').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_LOOP').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setLabel('Loop').setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_QUEUE').setEmoji('📋').setStyle(ButtonStyle.Secondary).setLabel('Queue').setDisabled(true),
      new ButtonBuilder().setCustomId('MUSIC_LEAVE').setEmoji('🚪').setStyle(ButtonStyle.Secondary).setLabel('Leave').setDisabled(true)
    );
    return [row1, row2];
  }

  /**
   * Send or update the controller message
   */
  async sendController() {
    if (!this.textChannel || !this.currentSong) return;

    const embed = this.buildNowPlayingEmbed();
    const components = this.buildControllerButtons();
    if (!embed) return;

    try {
      // Delete old controller message
      if (this.controllerMessage) {
        try { await this.controllerMessage.delete(); } catch {}
        this.controllerMessage = null;
      }

      // Send new controller
      this.controllerMessage = await this.textChannel.send({ embeds: [embed], components });

      // Start auto-refresh interval (update progress bar every 15s)
      this.startControllerRefresh();
    } catch (err) {
      console.error('Failed to send controller:', err.message);
    }
  }

  /**
   * Update the existing controller message in-place
   */
  async updateController() {
    if (!this.controllerMessage || !this.currentSong) return;

    try {
      const embed = this.buildNowPlayingEmbed();
      const components = this.buildControllerButtons();
      if (!embed) return;
      await this.controllerMessage.edit({ embeds: [embed], components });
    } catch {
      // Message may have been deleted
      this.controllerMessage = null;
    }
  }

  /**
   * Start auto-refresh of controller (updates progress bar)
   */
  startControllerRefresh() {
    this.stopControllerRefresh();
    this.controllerInterval = setInterval(() => {
      if (this.isPlaying && this.currentSong) {
        this.updateController();
      } else {
        this.stopControllerRefresh();
      }
    }, 15000); // refresh every 15 seconds
  }

  /**
   * Stop auto-refresh interval
   */
  stopControllerRefresh() {
    if (this.controllerInterval) {
      clearInterval(this.controllerInterval);
      this.controllerInterval = null;
    }
  }

  /**
   * Disable all buttons and mark as ended
   */
  async destroyController() {
    this.stopControllerRefresh();
    if (this.controllerMessage) {
      try {
        const embed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setDescription('`⏹️` Playback ended')
          .setFooter({ text: 'Cyborg Music' });
        await this.controllerMessage.edit({ embeds: [embed], components: this.buildDisabledButtons() });
      } catch {}
      this.controllerMessage = null;
    }
  }

  /**
   * Build a queue embed for button display
   */
  buildQueueEmbed(page = 1) {
    const queueData = this.getQueue();
    const pageSize = 10;
    const totalPages = Math.ceil(queueData.upcoming.length / pageSize) || 1;
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    const start = (clampedPage - 1) * pageSize;
    const end = start + pageSize;
    const queuePage = queueData.upcoming.slice(start, end);

    let description = `### 🎶 Currently Playing\n[\u200b${queueData.current.title}](${queueData.current.url})\n\`${queueData.current.author || 'Unknown'}\` • \`${this.formatDuration(queueData.current.duration)}\`\n`;

    if (queuePage.length > 0) {
      description += '\n### 📋 Up Next\n';
      description += queuePage
        .map((song, i) => `\`${start + i + 1}.\` [${song.title}](${song.url}) • \`${this.formatDuration(song.duration)}\``)
        .join('\n');
    } else if (queueData.upcoming.length === 0) {
      description += '\n*No more tracks in queue. Use `/play` to add more!*';
    }

    const totalDuration = queueData.upcoming.reduce((acc, s) => acc + (s.duration || 0), 0);

    return new EmbedBuilder()
      .setColor(EMBED_COLORS.MUSIC || '#5865F2')
      .setAuthor({ name: `Queue — ${queueData.upcoming.length} track(s)` })
      .setDescription(description)
      .setFooter({ text: `Page ${clampedPage}/${totalPages} • Total duration: ${this.formatDuration(totalDuration)} • Cyborg Music` });
  }
}

module.exports = MusicPlayer;

const { EmbedBuilder, MessageFlags } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * Handle all MUSIC_* button interactions
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleMusicButton(interaction) {
  const { member, guild, customId } = interaction;

  // Check if user is in a voice channel
  if (!member.voice.channel) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('`❌` You need to join a voice channel first'),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  const player = guild.client.musicManager.getPlayer(guild.id);

  // Check if the bot is playing
  if (!player.voiceConnection) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('`❌` Nothing is currently playing'),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Check if user is in the same voice channel as bot
  const botVoiceChannel = guild.members.me?.voice?.channel;
  if (botVoiceChannel && member.voice.channel.id !== botVoiceChannel.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('`❌` You need to be in the same voice channel as the bot'),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    switch (customId) {
      case 'MUSIC_PAUSE_RESUME': {
        const { AudioPlayerStatus } = require('@discordjs/voice');
        const isPaused = player.audioPlayer?.state?.status === AudioPlayerStatus.Paused;

        if (isPaused) {
          player.resume();
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.SUCCESS)
                .setDescription(`\`▶️\` Resumed by ${member}`),
            ],
          });
        } else {
          player.pause();
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.WARNING)
                .setDescription(`\`⏸️\` Paused by ${member}`),
            ],
          });
        }
        await player.updateController();
        break;
      }

      case 'MUSIC_SKIP': {
        const skipped = player.currentSong;
        player.skip();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.MUSIC || '#5865F2')
              .setDescription(`\`⏭️\` Skipped **${skipped?.title || 'current track'}** — ${member}`),
          ],
        });
        break;
      }

      case 'MUSIC_PREV': {
        // Restart current song from beginning
        if (player.currentSong) {
          player.queue.unshift(player.currentSong);
          player.audioPlayer.stop(); // triggers handleSongEnd → playNext
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.MUSIC || '#5865F2')
                .setDescription(`\`⏮️\` Restarted **${player.currentSong?.title || 'current track'}** — ${member}`),
            ],
          });
        } else {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription('`❌` Nothing to replay'),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }

      case 'MUSIC_STOP': {
        player.stop();
        await player.destroyController();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.ERROR)
              .setDescription(`\`⏹️\` Stopped and cleared the queue — ${member}`),
          ],
        });
        break;
      }

      case 'MUSIC_VOL_DOWN': {
        const newVol = Math.max(0, player.volume - 10);
        player.setVolume(newVol);
        // Apply volume to current resource
        if (player.audioPlayer?.state?.resource?.volume) {
          player.audioPlayer.state.resource.volume.setVolumeLogarithmic(newVol / 100);
        }
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.MUSIC || '#5865F2')
              .setDescription(`${player.getVolumeBar()}`),
          ],
        });
        await player.updateController();
        break;
      }

      case 'MUSIC_VOL_UP': {
        const newVol = Math.min(100, player.volume + 10);
        player.setVolume(newVol);
        if (player.audioPlayer?.state?.resource?.volume) {
          player.audioPlayer.state.resource.volume.setVolumeLogarithmic(newVol / 100);
        }
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.MUSIC || '#5865F2')
              .setDescription(`${player.getVolumeBar()}`),
          ],
        });
        await player.updateController();
        break;
      }

      case 'MUSIC_LOOP': {
        // Cycle: off → song → queue → off
        const modes = ['off', 'song', 'queue'];
        const currentIndex = modes.indexOf(player.loopMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        player.setLoopMode(nextMode);

        const modeIcons = { off: '▶️ Off', song: '🔂 Song', queue: '🔁 Queue' };
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(nextMode === 'off' ? EMBED_COLORS.WARNING : EMBED_COLORS.SUCCESS)
              .setDescription(`\`🔁\` Loop mode: **${modeIcons[nextMode]}** — ${member}`),
          ],
        });
        await player.updateController();
        break;
      }

      case 'MUSIC_SHUFFLE': {
        if (player.queue.length < 2) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription('`❌` Need at least 2 songs in the queue to shuffle'),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        player.shuffle();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.SUCCESS)
              .setDescription(`\`🔀\` Shuffled **${player.queue.length}** tracks — ${member}`),
          ],
        });
        await player.updateController();
        break;
      }

      case 'MUSIC_QUEUE': {
        if (!player.currentSong) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription('`❌` Nothing is currently playing'),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        const queueEmbed = player.buildQueueEmbed(1);
        await interaction.reply({
          embeds: [queueEmbed],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'MUSIC_LEAVE': {
        guild.client.musicManager.deletePlayer(guild.id);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.ERROR)
              .setDescription(`\`🚪\` Disconnected from voice — ${member}`),
          ],
        });
        break;
      }

      default:
        await interaction.reply({
          content: 'Unknown button action',
          flags: MessageFlags.Ephemeral,
        });
    }
  } catch (error) {
    console.error('Music button error:', error);
    const reply = {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(`\`❌\` An error occurred: ${error.message}`)
          .setFooter({ text: 'Cyborg Music' }),
      ],
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}

module.exports = { handleMusicButton };

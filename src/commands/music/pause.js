const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'pause',
  description: 'Pause the currently playing song',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: [],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message) {
    const response = await pause(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await pause(interaction);
    await interaction.followUp(response);
  },
};

async function pause({ member, guild, channel }) {
  if (!member.voice.channel) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('`\u274c` You need to join a voice channel first')
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  }

  try {
    const player = guild.client.musicManager.getPlayer(guild.id);

    if (!player.voiceConnection) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription('`\u274c` Nothing is currently playing')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    const paused = player.pause();
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(paused ? EMBED_COLORS.MUSIC || '#5865F2' : EMBED_COLORS.ERROR)
          .setDescription(paused ? '`\u23f8` Paused the current track' : '`\u274c` Failed to pause playback')
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Pause command error:', error);
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(`\`\u274c\` An error occurred: ${error.message}`)
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  }
}

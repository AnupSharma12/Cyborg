const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'loop',
  description: 'Loop the current song or queue',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['repeat'],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'mode',
        description: 'Loop mode',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'Off', value: 'off' },
          { name: 'Song', value: 'song' },
          { name: 'Queue', value: 'queue' },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const mode = args[0]?.toLowerCase() || 'song';
    const response = await loop(message, mode);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const mode = interaction.options.getString('mode');
    const response = await loop(interaction, mode);
    await interaction.followUp(response);
  },
};

async function loop({ member, guild, channel }, mode) {
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

    const success = player.setLoopMode(mode);
    if (!success) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription('`\u274c` Invalid loop mode. Use: `off`, `song`, or `queue`')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    const modeLabels = {
      off: { icon: '\u27a1', text: 'Loop disabled' },
      song: { icon: '\ud83d\udd02', text: 'Looping current track' },
      queue: { icon: '\ud83d\udd01', text: 'Looping entire queue' },
    };

    const label = modeLabels[mode];
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription(`\`${label.icon}\` ${label.text}`)
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Loop command error:', error);
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

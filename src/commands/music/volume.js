const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'volume',
  description: 'Set the player volume',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['vol'],
    usage: '<1-100>',
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'level',
        description: 'Volume level (1-100)',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 1,
        maxValue: 100,
      },
    ],
  },

  async messageRun(message, args) {
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 1 || volume > 100) {
      return message.safeReply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription('`\u274c` Please provide a valid volume between **1** and **100**')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      });
    }
    const response = await setVolume(message, volume);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const volume = interaction.options.getInteger('level');
    const response = await setVolume(interaction, volume);
    await interaction.followUp(response);
  },
};

async function setVolume({ member, guild, channel }, volume) {
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

    player.setVolume(volume);

    const volumeBar = '\u2588'.repeat(Math.round(volume / 10)) + '\u2591'.repeat(10 - Math.round(volume / 10));
    const icon = volume === 0 ? '\ud83d\udd07' : volume < 50 ? '\ud83d\udd09' : '\ud83d\udd0a';

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription(`\`${icon}\` Volume set to **${volume}%**\n\`${volumeBar}\``)
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Volume command error:', error);
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

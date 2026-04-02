const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'skip',
  description: 'Skip the currently playing song',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['next'],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message) {
    const response = await skip(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await skip(interaction);
    await interaction.followUp(response);
  },
};

async function skip({ member, guild, channel }) {
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

    const current = player.currentSong;
    player.skip();

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription(`\`\u23ed\` Skipped **${current?.title || 'current track'}**`)
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Skip command error:', error);
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

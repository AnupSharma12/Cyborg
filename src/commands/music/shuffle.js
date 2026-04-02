const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'shuffle',
  description: 'Shuffle the current queue',
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
    const response = await shuffle(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await shuffle(interaction);
    await interaction.followUp(response);
  },
};

async function shuffle({ member, guild, channel }) {
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

    if (player.queue.length === 0) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription('`\u274c` The queue is empty')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    player.shuffle();
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription(`\`\ud83d\udd00\` Shuffled **${player.queue.length}** tracks in the queue`)
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Shuffle command error:', error);
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

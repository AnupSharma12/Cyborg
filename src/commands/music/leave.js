const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'leave',
  description: 'Disconnect the bot from voice channel',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['dc'],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message) {
    const response = await disconnect(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await disconnect(interaction);
    await interaction.followUp(response);
  },
};

async function disconnect({ member, guild, channel }) {
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
            .setDescription('`\u274c` Not connected to a voice channel')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    player.disconnect();
    guild.client.musicManager.deletePlayer(guild.id);
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription('`\ud83d\udc4b` Disconnected from voice channel')
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Disconnect command error:', error);
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

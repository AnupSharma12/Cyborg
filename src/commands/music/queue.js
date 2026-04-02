const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'queue',
  description: 'Show the current music queue',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['q'],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'page',
        description: 'Page number to display',
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const page = args[0] ? parseInt(args[0]) : 1;
    const response = await queue(message, page);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const page = interaction.options.getInteger('page') || 1;
    const response = await queue(interaction, page);
    await interaction.followUp(response);
  },
};

async function queue({ member, guild, channel }, page = 1) {
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

    if (!player.voiceConnection || !player.getQueue().current) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription('`\u274c` Nothing is currently playing')
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    const queueData = player.getQueue();
    const pageSize = 10;
    const totalPages = Math.ceil(queueData.upcoming.length / pageSize) || 1;
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    const start = (clampedPage - 1) * pageSize;
    const end = start + pageSize;
    const queuePage = queueData.upcoming.slice(start, end);

    let description = `### Currently Playing\n[\u200b${queueData.current.title}](${queueData.current.url})\n\`${queueData.current.author || 'Unknown'}\` \u2022 \`${formatDuration(queueData.current.duration)}\`\n`;

    if (queuePage.length > 0) {
      description += '\n### Up Next\n';
      description += queuePage
        .map(
          (song, i) =>
            `\`${start + i + 1}.\` [${song.title}](${song.url}) \u2022 \`${formatDuration(song.duration)}\``
        )
        .join('\n');
    } else if (queueData.upcoming.length === 0) {
      description += '\n*No more tracks in queue*';
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.MUSIC || '#5865F2')
      .setAuthor({ name: `Queue \u2022 ${guild.name}` })
      .setDescription(description)
      .setFooter({ text: `Page ${clampedPage}/${totalPages} \u2022 ${queueData.upcoming.length} track(s) in queue \u2022 Cyborg Music` })
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    guild.client.logger.error('Queue command error:', error);
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

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'LIVE';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

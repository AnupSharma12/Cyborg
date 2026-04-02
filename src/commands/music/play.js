const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { EMBED_COLORS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'play',
  description: 'Play a song from YouTube',
  category: 'MUSIC',
  botPermissions: ['Connect', 'Speak', 'EmbedLinks'],
  command: {
    enabled: true,
    aliases: ['p'],
    usage: '<song-name-or-url>',
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'query',
        description: 'YouTube URL or search query',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const query = args.join(' ');
    const response = await play(message, query);
    if (response) await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const query = interaction.options.getString('query');
    const response = await play(interaction, query);
    if (response) await interaction.followUp(response);
  },
};

async function play(context, query) {
  const { member, guild, channel } = context;

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
    let player = guild.client.musicManager.getPlayer(guild.id);

    // Connect if not already connected
    if (!player.voiceConnection) {
      await player.connect(member.voice.channel, channel);
    }

    const result = await player.play(query, member.id);

    if (result.error) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(`\`\u274c\` ${result.error}`)
            .setFooter({ text: 'Cyborg Music' }),
        ],
      };
    }

    if (result.position) {
      return {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.MUSIC || '#5865F2')
            .setAuthor({ name: 'Added to Queue' })
            .setDescription(`### [\u200b${result.song.title}](${result.song.url})`)
            .setThumbnail(result.song.thumbnail)
            .addFields(
              { name: 'Artist', value: `\`${result.song.author || 'Unknown'}\``, inline: true },
              { name: 'Position', value: `\`#${result.position}\``, inline: true },
              { name: 'Duration', value: `\`${formatDuration(result.song.duration)}\``, inline: true }
            )
            .setFooter({ text: 'Cyborg Music' })
            .setTimestamp(),
        ],
      };
    }

    // Now playing embed is sent by the player itself
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.MUSIC || '#5865F2')
          .setDescription('`\ud83d\udd0d` Searching and loading your track...')
          .setFooter({ text: 'Cyborg Music' }),
      ],
    };
  } catch (error) {
    guild.client.logger.error('Play command error:', error);
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

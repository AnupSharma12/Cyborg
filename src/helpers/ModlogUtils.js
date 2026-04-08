const EmbedUtils = require("@helpers/EmbedUtils");
const { getModlogChannelId } = require("@src/database/modlog");

async function getConfiguredLogChannel(guild, type) {
  const channelId = getModlogChannelId(guild.id, type);
  if (!channelId) return null;

  let channel = guild.channels.cache.get(channelId);
  if (!channel) {
    channel = await guild.channels.fetch(channelId).catch(() => null);
  }
  if (!channel?.isTextBased?.()) return null;
  return channel;
}

async function sendModlog(guild, type, title, lines = []) {
  const channel = await getConfiguredLogChannel(guild, type);
  if (!channel) return;

  const embed = EmbedUtils.embed()
    .setTitle(title)
    .setDescription(lines.filter(Boolean).join("\n"))
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = {
  sendModlog,
  getConfiguredLogChannel,
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'leaveserver',
  description: 'leave a server.',
  category: 'OWNER',
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: true,
    minArgsCount: 1,
    usage: '<serverId>',
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args, data) {
    const input = args[0]
    const guild = message.client.guilds.cache.get(input)
    if (!guild) {
      return message.reply(
        `No server found. Please provide a valid server id.\nYou may use \`${data.prefix}findserver/\` or \`${data.prefix}listservers\` to find the server id`
      )
    }

    const name = guild.name
    try {
      await message.reply(`Successfully Left \`${name}\``)
      await guild.leave()
    } catch (err) {
      message.client.logger.error('GuildLeave', err)
      return message.reply(`Failed to leave \`${name}\``)
    }
  },
}

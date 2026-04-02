const { EmbedBuilder, MessageFlags} = require('discord.js')

module.exports = {
  name: 'say',
  description: 'Says a message as Mina to a channel you choose!',
  category: 'ADMIN',
  botPermissions: ['SendMessages'],
  userPermissions: ['ManageMessages'],
  slashCommand: {
    enabled: true,
    flags: MessageFlags.Ephemeral,
    options: [
      {
        name: 'message',
        description: 'The message to be sent.',
        type: 3,
        required: true,
      },
      {
        name: 'channel',
        description: 'The channel where the message will be sent.',
        type: 7,
        required: false,
      },
      {
        name: 'message_id',
        description: 'The ID of the message to edit or reply to.',
        type: 3,
        required: false,
      },
      {
        name: 'edit',
        description:
          'Whether to edit the message specified by message_id instead of sending a new message.',
        type: 5,
        required: false,
      },
      {
        name: 'ping',
        description:
          'Whether to ping everyone in the channel after sending the message.',
        type: 5,
        required: false,
      },
    ],
  },

  async execute(interaction) {
    const { options } = interaction

    // Retrieve the message content
    const message = options.getString('message').replace(/\\n/g, '\n')

    // Retrieve the channel where the message will be sent
    const channel = options.getChannel('channel') || interaction.channel

    // Retrieve the message ID to edit or reply to
    const message_id = options.getString('message_id')

    // Retrieve whether to edit the message specified by message_id
    const edit = options.getBoolean('edit')

    // Retrieve whether to ping everyone in the channel after sending the message
    const ping = options.getBoolean('ping')

    try {
      // If a message ID is provided, retrieve the message and edit or reply to it
      if (message_id) {
        const replyMessage = await channel.messages
          .fetch(message_id)
          .catch(() => null)

        if (!replyMessage) {
          await interaction.followUp({
            content:
              'Oopsie! 😅 That message ID seems invalid. Please try again! 💔',
            flags: MessageFlags.Ephemeral,
          })
          return
        }

        if (edit) {
          await replyMessage.edit(message)
          await interaction.followUp({
            content: '✨ Message edited successfully! ✨',
            flags: MessageFlags.Ephemeral,
          })
        } else {
          await replyMessage.reply({
            content: `${message}\n${ping ? '@everyone' : ''}`,
            allowedMentions: { parse: ['everyone', 'roles', 'users'] },
          })
          await interaction.followUp({
            content: '🎉 Message replied successfully! 🎉',
            flags: MessageFlags.Ephemeral,
          })
        }
      } else {
        // If no message ID is provided, send a new message
        await channel.send({
          content: message,
          allowedMentions: { parse: ['everyone', 'roles', 'users'] },
        })

        if (ping) {
          setTimeout(async () => {
            await channel.send({
              content: '@everyone',
              allowedMentions: { parse: ['everyone', 'roles', 'users'] },
            })
          }, 2000) // wait 2 seconds before sending the second message
        }

        // Send the final reply
        await interaction.followUp({
          content: '✨ Your message has been sent! ✨',
          flags: MessageFlags.Ephemeral,
        })
      }
    } catch (error) {
      console.error(error)
      await interaction.followUp({
        content:
          'Oh no! 😱 An error occurred while processing this command. Please try again later! 💖',
        flags: MessageFlags.Ephemeral,
      })
    }
  },

  async interactionRun(interaction) {
    await this.execute(interaction)
  },
}

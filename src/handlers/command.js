const { OWNER_IDS, PREFIX_COMMANDS } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const { error } = require("@helpers/EmbedUtils");
const WebhookLogger = require("@helpers/WebhookLogger");
const { MessageFlags } = require("discord.js");

const cooldownCache = new Map();

module.exports = {
  /**
   * @param {import("discord.js").Message} message
   * @param {import("@structures/Command")} cmd
   * @param {string} prefix
   */
  handlePrefixCommand: async function (message, cmd, prefix) {
    const args = message.content.replace(prefix, "").split(/\s+/);
    const invoke = args.shift().toLowerCase();

    if (
      !message.channel
        .permissionsFor(message.guild.members.me)
        .has("SendMessages")
    )
      return;

    // Owner commands
    if (cmd.category === "OWNER" && !OWNER_IDS.includes(message.author.id)) {
      return message.reply({ embeds: [error("This command is only accessible to bot owners.")] });
    }

    // Check user permissions
    if (cmd.userPermissions && cmd.userPermissions.length > 0) {
      if (
        !message.channel.permissionsFor(message.member).has(cmd.userPermissions)
      ) {
        return message.reply({ embeds: [error("You don't have permission to use this command.")] });
      }
    }

    // Check bot permissions
    if (cmd.botPermissions && cmd.botPermissions.length > 0) {
      if (
        !message.channel
          .permissionsFor(message.guild.members.me)
          .has(cmd.botPermissions)
      ) {
        return message.reply({ embeds: [error("I don't have the required permissions for this command.")] });
      }
    }

    // Min args check
    if (cmd.command.minArgsCount > args.length) {
      return message.reply({ embeds: [error(`Usage: \`${prefix}${invoke} ${cmd.command.usage || ""}\``)] });
    }

    // Cooldown check
    if (cmd.cooldown > 0) {
      const remaining = getRemainingCooldown(message.author.id, cmd);
      if (remaining > 0) {
        return message.reply({ embeds: [error(`You are on cooldown. Try again in \`${timeformat(remaining)}\``)] });
      }
    }

    try {
      await cmd.messageRun(message, args, { prefix, invoke });
    } catch (ex) {
      message.client.logger.error("messageRun", ex);
      WebhookLogger.logError(`messageRun: ${cmd.name}`, ex);
      message.reply({ embeds: [error("An error occurred while running this command.")] });
    } finally {
      if (cmd.cooldown > 0) applyCooldown(message.author.id, cmd);
    }
  },

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  handleSlashCommand: async function (interaction) {
    const cmd = interaction.client.slashCommands.get(interaction.commandName);
    if (!cmd)
      return interaction
        .reply({ content: "An error has occurred", flags: MessageFlags.Ephemeral })
        .catch(() => {});

    // Owner commands
    if (cmd.category === "OWNER" && !OWNER_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [error("This command is only accessible to bot owners.")],
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }

    // Check user permissions
    if (interaction.member && cmd.userPermissions?.length > 0) {
      if (!interaction.member.permissions.has(cmd.userPermissions)) {
        return interaction.reply({
          embeds: [error("You don't have permission to use this command.")],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }

    // Check bot permissions
    if (cmd.botPermissions && cmd.botPermissions.length > 0) {
      if (!interaction.guild.members.me.permissions.has(cmd.botPermissions)) {
        return interaction.reply({
          embeds: [error("I don't have the required permissions for this command.")],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }

    // Cooldown check
    if (cmd.cooldown > 0) {
      const remaining = getRemainingCooldown(interaction.user.id, cmd);
      if (remaining > 0) {
        return interaction.reply({
          embeds: [error(`You are on cooldown. Try again in \`${timeformat(remaining)}\``)],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }

    try {
      const deferOptions = cmd.slashCommand.ephemeral ? { flags: MessageFlags.Ephemeral } : {};
      await interaction.deferReply(deferOptions).catch(() => null);
      if (!interaction.deferred) return;
      await cmd.interactionRun(interaction, {});
    } catch (ex) {
      await interaction.followUp({ embeds: [error("An error occurred while running this command.")] }).catch(() => null);
      interaction.client.logger.error("interactionRun", ex);
      WebhookLogger.logError(`interactionRun: ${cmd.name}`, ex);
    } finally {
      if (cmd.cooldown > 0) applyCooldown(interaction.user.id, cmd);
    }
  },

  /**
   * Build a usage string for a command
   * @param {import("@structures/Command")} cmd
   * @param {string} prefix
   * @param {string} invoke
   */
  getCommandUsage(cmd, prefix = PREFIX_COMMANDS.DEFAULT_PREFIX, invoke) {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands
        .map((sub) => `\`${prefix}${invoke || cmd.name} ${sub.trigger}\` — ${sub.description}`)
        .join("\n");
    }
    return `\`${prefix}${invoke || cmd.name} ${cmd.command.usage || ""}\``;
  },
};

function applyCooldown(memberId, cmd) {
  const key = cmd.name + "|" + memberId;
  cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(memberId, cmd) {
  const key = cmd.name + "|" + memberId;
  if (cooldownCache.has(key)) {
    const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
    if (remaining > cmd.cooldown) {
      cooldownCache.delete(key);
      return 0;
    }
    return cmd.cooldown - remaining;
  }
  return 0;
}

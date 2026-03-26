const { MessageFlags } = require("discord.js");
const { timeformat } = require("@helpers/Utils");

const cooldownCache = new Map();

module.exports = {
  /**
   * @param {import("discord.js").ContextMenuCommandInteraction} interaction
   * @param {import("@structures/BaseContext")} context
   */
  handleContext: async function (interaction, context) {
    // Cooldown check
    if (context.cooldown) {
      const remaining = getRemainingCooldown(interaction.user.id, context);
      if (remaining > 0) {
        return interaction.reply({
          content: `You are on cooldown. Try again in \`${timeformat(remaining)}\``,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Check user permissions
    if (
      interaction.member &&
      context.userPermissions &&
      context.userPermissions.length > 0
    ) {
      if (!interaction.member.permissions.has(context.userPermissions)) {
        return interaction.reply({
          content: "You don't have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    try {
      await interaction.deferReply(
        context.ephemeral ? { flags: MessageFlags.Ephemeral } : {}
      );
      await context.run(interaction);
    } catch (ex) {
      interaction.followUp("An error occurred while running this command.");
      interaction.client.logger.error("contextRun", ex);
    } finally {
      if (context.cooldown) applyCooldown(interaction.user.id, context);
    }
  },
};

function applyCooldown(memberId, context) {
  const key = context.name + "|" + memberId;
  cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(memberId, context) {
  const key = context.name + "|" + memberId;
  if (cooldownCache.has(key)) {
    const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
    if (remaining > context.cooldown) {
      cooldownCache.delete(key);
      return 0;
    }
    return context.cooldown - remaining;
  }
  return 0;
}

const {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "giveaway",
  description: "Manage giveaways",
  category: "GIVEAWAY",
  cooldown: 3,
  userPermissions: ["ManageMessages"],
  botPermissions: ["ViewChannel", "SendMessages", "EmbedLinks", "AddReactions"],
  command: {
    enabled: true,
    usage: "<start|pause|resume|end|reroll|edit|list> ...",
    minArgsCount: 1,
    aliases: ["gaway", "gstart"],
    subcommands: [
      { trigger: "start <#channel> <duration> <winners> <prize>", description: "Start a giveaway" },
      { trigger: "pause <messageId>", description: "Pause a giveaway" },
      { trigger: "resume <messageId>", description: "Resume a paused giveaway" },
      { trigger: "end <messageId>", description: "End a giveaway" },
      { trigger: "reroll <messageId>", description: "Reroll winners" },
      {
        trigger: "edit <messageId> [addDuration] [newWinnerCount] [newPrize]",
        description: "Edit giveaway details",
      },
      { trigger: "list", description: "List active giveaways" },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "start",
        description: "Start a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "Channel where giveaway will be posted",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: "duration",
            description: "Duration like 10m, 1h, 2d, 1w",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "winners",
            description: "Number of winners",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
          {
            name: "prize",
            description: "Giveaway prize",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "pause",
        description: "Pause a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "Giveaway message id",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "resume",
        description: "Resume a paused giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "Giveaway message id",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "end",
        description: "End a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "Giveaway message id",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reroll",
        description: "Reroll a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "Giveaway message id",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "edit",
        description: "Edit a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "Giveaway message id",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "add_duration",
            description: "Extra time to add (e.g., 15m)",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
          {
            name: "new_winners",
            description: "New winner count",
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
          {
            name: "new_prize",
            description: "New prize text",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "list",
        description: "List active giveaways",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    if (!message.client.giveawaysManager) {
      return message.reply({ embeds: [EmbedUtils.error("Giveaway system is disabled.")] });
    }

    const sub = (args[0] || "").toLowerCase();

    if (sub === "start") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      const durationText = args[2];
      const winners = parseInt(args[3], 10);
      const prize = args.slice(4).join(" ").trim();

      return message.reply({
        embeds: [await startGiveaway(message.member, channel, durationText, winners, prize)],
      });
    }

    if (sub === "pause") {
      return message.reply({ embeds: [await pauseGiveaway(message.member, args[1])] });
    }

    if (sub === "resume") {
      return message.reply({ embeds: [await resumeGiveaway(message.member, args[1])] });
    }

    if (sub === "end") {
      return message.reply({ embeds: [await endGiveaway(message.member, args[1])] });
    }

    if (sub === "reroll") {
      return message.reply({ embeds: [await rerollGiveaway(message.member, args[1])] });
    }

    if (sub === "edit") {
      const messageId = args[1];
      const addDuration = args[2] ? parseDuration(args[2]) : 0;
      const newWinnerCount = args[3] ? parseInt(args[3], 10) : undefined;
      const newPrize = args.slice(4).join(" ").trim() || undefined;
      return message.reply({
        embeds: [
          await editGiveaway(
            message.member,
            messageId,
            addDuration,
            Number.isNaN(newWinnerCount) ? undefined : newWinnerCount,
            newPrize
          ),
        ],
      });
    }

    if (sub === "list") {
      return message.reply({ embeds: [await listGiveaways(message.member)] });
    }

    return message.reply({ embeds: [EmbedUtils.error("Invalid subcommand. Use start/pause/resume/end/reroll/edit/list")] });
  },

  async interactionRun(interaction) {
    if (!interaction.client.giveawaysManager) {
      return interaction.followUp({ embeds: [EmbedUtils.error("Giveaway system is disabled.")] });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const channel = interaction.options.getChannel("channel", true);
      const durationText = interaction.options.getString("duration", true);
      const winners = interaction.options.getInteger("winners", true);
      const prize = interaction.options.getString("prize", true);

      return interaction.followUp({
        embeds: [await startGiveaway(interaction.member, channel, durationText, winners, prize)],
      });
    }

    if (sub === "pause") {
      return interaction.followUp({
        embeds: [await pauseGiveaway(interaction.member, interaction.options.getString("message_id", true))],
      });
    }

    if (sub === "resume") {
      return interaction.followUp({
        embeds: [await resumeGiveaway(interaction.member, interaction.options.getString("message_id", true))],
      });
    }

    if (sub === "end") {
      return interaction.followUp({
        embeds: [await endGiveaway(interaction.member, interaction.options.getString("message_id", true))],
      });
    }

    if (sub === "reroll") {
      return interaction.followUp({
        embeds: [await rerollGiveaway(interaction.member, interaction.options.getString("message_id", true))],
      });
    }

    if (sub === "edit") {
      const messageId = interaction.options.getString("message_id", true);
      const addDurationText = interaction.options.getString("add_duration");
      const addDuration = addDurationText ? parseDuration(addDurationText) : 0;
      const newWinnerCount = interaction.options.getInteger("new_winners") || undefined;
      const newPrize = interaction.options.getString("new_prize") || undefined;

      return interaction.followUp({
        embeds: [await editGiveaway(interaction.member, messageId, addDuration, newWinnerCount, newPrize)],
      });
    }

    if (sub === "list") {
      return interaction.followUp({ embeds: [await listGiveaways(interaction.member)] });
    }

    return interaction.followUp({ embeds: [EmbedUtils.error("Invalid subcommand")] });
  },
};

async function startGiveaway(member, giveawayChannel, durationText, winners, prize) {
  if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return EmbedUtils.error("You need Manage Messages permission to start giveaways.");
  }

  if (!giveawayChannel || giveawayChannel.type !== ChannelType.GuildText) {
    return EmbedUtils.error("Please provide a valid text channel.");
  }

  const duration = parseDuration(durationText);
  if (!duration) {
    return EmbedUtils.error("Invalid duration. Example: 10m, 1h, 2d, 1w");
  }

  if (!Number.isInteger(winners) || winners <= 0) {
    return EmbedUtils.error("Winner count must be a positive number.");
  }

  if (!prize) {
    return EmbedUtils.error("Please provide a giveaway prize.");
  }

  await member.client.giveawaysManager.start(giveawayChannel, {
    duration,
    prize,
    winnerCount: winners,
    hostedBy: member.user,
    thumbnail: "https://i.imgur.com/DJuTuxs.png",
    messages: {
      giveaway: "🎉 **GIVEAWAY** 🎉",
      giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
      inviteToParticipate: `React with ${member.client.config.GIVEAWAYS?.REACTION || "🎁"} to enter`,
      dropMessage: "Be the first to react to win!",
      hostedBy: `\nHosted by: ${member.user.username}`,
    },
  });

  return EmbedUtils.success(`Giveaway started in ${giveawayChannel}`);
}

async function pauseGiveaway(member, messageId) {
  const giveaway = findGuildGiveaway(member, messageId);
  if (!giveaway) return EmbedUtils.error(`Unable to find a giveaway for message id: ${messageId || "none"}`);
  if (giveaway.pauseOptions?.isPaused) return EmbedUtils.error("This giveaway is already paused.");
  await giveaway.pause();
  return EmbedUtils.success("Giveaway paused.");
}

async function resumeGiveaway(member, messageId) {
  const giveaway = findGuildGiveaway(member, messageId);
  if (!giveaway) return EmbedUtils.error(`Unable to find a giveaway for message id: ${messageId || "none"}`);
  if (!giveaway.pauseOptions?.isPaused) return EmbedUtils.error("This giveaway is not paused.");
  await giveaway.unpause();
  return EmbedUtils.success("Giveaway resumed.");
}

async function endGiveaway(member, messageId) {
  const giveaway = findGuildGiveaway(member, messageId);
  if (!giveaway) return EmbedUtils.error(`Unable to find a giveaway for message id: ${messageId || "none"}`);
  if (giveaway.ended) return EmbedUtils.error("This giveaway has already ended.");
  await giveaway.end();
  return EmbedUtils.success("Giveaway ended.");
}

async function rerollGiveaway(member, messageId) {
  const giveaway = findGuildGiveaway(member, messageId);
  if (!giveaway) return EmbedUtils.error(`Unable to find a giveaway for message id: ${messageId || "none"}`);
  if (!giveaway.ended) return EmbedUtils.error("This giveaway has not ended yet.");
  await giveaway.reroll();
  return EmbedUtils.success("Giveaway rerolled.");
}

async function editGiveaway(member, messageId, addDuration, newWinnerCount, newPrize) {
  const giveaway = findGuildGiveaway(member, messageId);
  if (!giveaway) return EmbedUtils.error(`Unable to find a giveaway for message id: ${messageId || "none"}`);

  await member.client.giveawaysManager.edit(messageId, {
    addTime: addDuration || 0,
    newPrize: newPrize || giveaway.prize,
    newWinnerCount: newWinnerCount || giveaway.winnerCount,
  });

  return EmbedUtils.success("Giveaway updated.");
}

async function listGiveaways(member) {
  const giveaways = member.client.giveawaysManager.giveaways.filter(
    (g) => g.guildId === member.guild.id && !g.ended
  );

  if (giveaways.length === 0) {
    return EmbedUtils.error("There are no active giveaways in this server.");
  }

  const description = giveaways
    .map((g, i) => `${i + 1}. **${g.prize}** in <#${g.channelId}> (message: \`${g.messageId}\`)`)
    .join("\n");

  return EmbedUtils.embed()
    .setTitle("Active Giveaways")
    .setDescription(description)
    .setFooter({ text: `${giveaways.length} active giveaway(s)` });
}

function findGuildGiveaway(member, messageId) {
  if (!messageId) return null;
  if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return null;

  return member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );
}

function parseDuration(input) {
  if (!input || typeof input !== "string") return null;
  const match = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d|w)$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value) || value <= 0) return null;

  const multipliers = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };

  return value * multipliers[unit];
}
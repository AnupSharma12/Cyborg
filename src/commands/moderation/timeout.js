const { ApplicationCommandOptionType } = require("discord.js");

const DURATION_MAP = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "10m": 10 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "14d": 14 * 24 * 60 * 60 * 1000,
  "28d": 28 * 24 * 60 * 60 * 1000,
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "timeout",
  description: "Timeout (mute) a member for a duration",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  command: {
    enabled: true,
    usage: "<@member|ID> <duration> [reason]",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The member to timeout",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "Timeout duration (1m, 5m, 10m, 30m, 1h, 6h, 12h, 1d, 3d, 7d, 14d, 28d)",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: Object.keys(DURATION_MAP).map((k) => ({ name: k, value: k })),
      },
      {
        name: "reason",
        description: "Reason for the timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = args[0].match(/(\d{17,20})/);
    if (!match) return message.reply("Please provide a valid member mention or ID.");

    const target = await message.guild.members.fetch(match[1]).catch(() => null);
    if (!target) return message.reply("Could not find that member.");

    const duration = args[1]?.toLowerCase();
    if (!DURATION_MAP[duration]) {
      return message.reply(`Invalid duration. Valid options: ${Object.keys(DURATION_MAP).join(", ")}`);
    }

    const reason = args.slice(2).join(" ") || "No reason provided";
    const response = await timeout(message.member, target, DURATION_MAP[duration], duration, reason);
    await message.reply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!target) return interaction.followUp("Could not find that member.");

    const response = await timeout(interaction.member, target, DURATION_MAP[duration], duration, reason);
    await interaction.followUp(response);
  },
};

async function timeout(issuer, target, ms, label, reason) {
  if (!target.moderatable) return `I do not have permission to timeout ${target.user.username}.`;
  const isOwner = issuer.id === issuer.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= issuer.roles.highest.position) {
    return `You cannot timeout ${target.user.username} — they have an equal or higher role.`;
  }

  try {
    await target.timeout(ms, `${reason} | By: ${issuer.user.username}`);
    return `Successfully timed out **${target.user.username}** for ${label}. Reason: ${reason}`;
  } catch {
    return `Failed to timeout ${target.user.username}.`;
  }
}

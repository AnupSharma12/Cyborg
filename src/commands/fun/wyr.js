const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "wyr",
  description: "Would You Rather question with voting",
  category: "FUN",
  cooldown: 5,
  botPermissions: ["EmbedLinks", "AddReactions"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message) {
    const wyr = await getWYR();
    if (!wyr) return message.reply({ embeds: [EmbedUtils.error("Failed to fetch a Would You Rather question.")] });

    const embed = EmbedUtils.embed()
      .setTitle("Would You Rather?")
      .setDescription(`**Option 1️⃣:** ${wyr.ops1}\n\n**Option 2️⃣:** ${wyr.ops2}`)
      .setFooter({ text: `Requested by ${message.author.username}` });

    const msg = await message.reply({ embeds: [embed] });
    await addReactionsAndCollect(msg, wyr);
  },

  async interactionRun(interaction) {
    const wyr = await getWYR();
    if (!wyr) return interaction.followUp({ embeds: [EmbedUtils.error("Failed to fetch a Would You Rather question.")] });

    const embed = EmbedUtils.embed()
      .setTitle("Would You Rather?")
      .setDescription(`**Option 1️⃣:** ${wyr.ops1}\n\n**Option 2️⃣:** ${wyr.ops2}`)
      .setFooter({ text: `Requested by ${interaction.user.username}` });

    await interaction.followUp({ embeds: [embed] });
    const msg = await interaction.fetchReply();
    await addReactionsAndCollect(msg, wyr);
  },
};

async function addReactionsAndCollect(msg, wyr) {
  try {
    await msg.react("1️⃣");
    await msg.react("2️⃣");
  } catch {
    return;
  }

  const collector = msg.createReactionCollector({
    filter: (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && !user.bot,
    time: 30_000,
  });

  collector.on("end", () => {
    const r1 = msg.reactions.cache.get("1️⃣");
    const r2 = msg.reactions.cache.get("2️⃣");
    const v1 = r1 ? r1.count - 1 : 0; // subtract bot's own reaction
    const v2 = r2 ? r2.count - 1 : 0;
    const total = v1 + v2;
    const p1 = total > 0 ? ((v1 / total) * 100).toFixed(1) : 0;
    const p2 = total > 0 ? ((v2 / total) * 100).toFixed(1) : 0;

    const resultEmbed = EmbedUtils.embed()
      .setTitle("Would You Rather — Results")
      .setDescription(
        `**Option 1️⃣:** ${wyr.ops1}\n**Votes:** ${v1} (${p1}%)\n\n` +
          `**Option 2️⃣:** ${wyr.ops2}\n**Votes:** ${v2} (${p2}%)\n\n` +
          `**Total Votes:** ${total}`,
      )
      .setFooter({ text: "Voting has ended!" });

    msg.edit({ embeds: [resultEmbed] }).catch(() => {});
  });
}

async function getWYR() {
  try {
    const res = await fetch("https://api.popcat.xyz/v2/wyr", { signal: AbortSignal.timeout(10_000) });
    const json = await res.json();
    if (json.error || !json.message) return null;
    return { ops1: json.message.ops1, ops2: json.message.ops2 };
  } catch {
    return null;
  }
}

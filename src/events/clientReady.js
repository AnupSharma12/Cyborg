const { ActivityType } = require("discord.js");

const ACTIVITY_TYPE_MAP = {
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching,
  COMPETING: ActivityType.Competing,
};

/**
 * @param {import("@src/structures").BotClient} client
 */
module.exports = async (client) => {
  const config = client.config;
  const presence = config.PRESENCE || {};

  // ─── Startup Banner ──────────────────────────────────────────────
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const prefixCmds = client.commands?.length || 0;
  const slashCmds = client.slashCommands?.size || 0;
  const totalCmds = new Set([
    ...client.commands.map((c) => c.name),
    ...client.slashCommands.map((c) => c.name),
  ]).size;

  const line = "─".repeat(45);
  console.log();
  console.log(`  ┌${line}┐`);
  console.log(`  │  🤖  ${client.user.tag.padEnd(37)}│`);
  console.log(`  ├${line}┤`);
  console.log(`  │  Servers   : ${String(guilds).padEnd(29)}│`);
  console.log(`  │  Users     : ${String(users.toLocaleString()).padEnd(29)}│`);
  console.log(`  │  Commands  : ${String(totalCmds + " total (" + prefixCmds + " prefix / " + slashCmds + " slash)").padEnd(29)}│`);
  console.log(`  │  Prefix    : ${String(config.PREFIX_COMMANDS.DEFAULT_PREFIX).padEnd(29)}│`);
  console.log(`  │  Node.js   : ${process.version.padEnd(29)}│`);
  console.log(`  └${line}┘`);
  console.log();

  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`);

  if (config.GIVEAWAYS?.ENABLED && client.giveawaysManager) {
    client.logger.log("Initializing giveaways manager...");
    await client.giveawaysManager
      ._init()
      .then(() => client.logger.success("Giveaway Manager initialized"))
      .catch((err) => client.logger.error("Giveaway Manager init failed", err));
  }

  // ─── Presence / Activity ─────────────────────────────────────────
  if (presence.ENABLED !== false) {
    const activities = presence.ACTIVITIES || [
      { name: "/help", type: "LISTENING" },
      { name: "{servers} servers", type: "WATCHING" },
      { name: "{users} users", type: "WATCHING" },
    ];

    const interval = (presence.INTERVAL || 30) * 1000;
    const status = presence.STATUS || "online";

    // Set initial
    setPresence(client, activities[0], status, totalCmds);

    // Rotate
    let index = 0;
    setInterval(() => {
      index = (index + 1) % activities.length;
      setPresence(client, activities[index], status, totalCmds);
    }, interval);
  }

  // ─── Register Interactions ───────────────────────────────────────
  if (config.INTERACTIONS.SLASH || config.INTERACTIONS.CONTEXT) {
    if (config.INTERACTIONS.GLOBAL) await client.registerInteractions();
    else await client.registerInteractions(config.INTERACTIONS.TEST_GUILD_ID);
  }
};

function setPresence(client, activity, status, totalCmds) {
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const name = activity.name
    .replace("{servers}", guilds)
    .replace("{users}", users.toLocaleString())
    .replace("{commands}", totalCmds);
  const type = ACTIVITY_TYPE_MAP[activity.type] || ActivityType.Playing;
  client.user.setPresence({ activities: [{ name, type }], status });
}

const { ActivityType } = require("discord.js");

const ACTIVITIES = [
  { name: "/help", type: ActivityType.Listening },
  { name: "{servers} servers", type: ActivityType.Watching },
  { name: "{users} users", type: ActivityType.Watching },
  { name: "with moderation tools", type: ActivityType.Playing },
];

/**
 * @param {import("@src/structures").BotClient} client
 */
module.exports = async (client) => {
  // Startup banner
  const line = "─".repeat(45);
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const cmds = client.commands?.length || 0;
  const slash = client.slashCommands?.size || 0;

  console.log();
  console.log(`  ┌${line}┐`);
  console.log(`  │  🤖  ${client.user.tag.padEnd(37)}│`);
  console.log(`  ├${line}┤`);
  console.log(`  │  Servers   : ${String(guilds).padEnd(29)}│`);
  console.log(`  │  Users     : ${String(users.toLocaleString()).padEnd(29)}│`);
  console.log(`  │  Commands  : ${String(cmds + " prefix / " + slash + " slash").padEnd(29)}│`);
  console.log(`  │  Node.js   : ${process.version.padEnd(29)}│`);
  console.log(`  └${line}┘`);
  console.log();

  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`);

  // Set initial activity
  updateActivity(client, 0);

  // Rotate activity every 30 seconds
  let index = 0;
  setInterval(() => {
    index = (index + 1) % ACTIVITIES.length;
    updateActivity(client, index);
  }, 30_000);

  // Register Interactions
  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    if (client.config.INTERACTIONS.GLOBAL) await client.registerInteractions();
    else
      await client.registerInteractions(
        client.config.INTERACTIONS.TEST_GUILD_ID
      );
  }
};

function updateActivity(client, index) {
  const activity = ACTIVITIES[index];
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const name = activity.name
    .replace("{servers}", guilds)
    .replace("{users}", users.toLocaleString());
  client.user.setActivity(name, { type: activity.type });
}

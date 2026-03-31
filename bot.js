require("dotenv").config();
require("module-alias/register");

const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");
const Logger = require("@helpers/Logger");
const WebhookLogger = require("@helpers/WebhookLogger");

validateConfiguration();

const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// ─── Error Handling ──────────────────────────────────────────────────────────

process.on("unhandledRejection", (err) => {
  Logger.error("Unhandled exception", err);
  WebhookLogger.logError("Unhandled Rejection", err);
});

process.on("uncaughtException", (err) => {
  Logger.error("Uncaught Exception", err);
  WebhookLogger.logError("Uncaught Exception", err);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

async function shutdown(signal) {
  Logger.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    client.destroy();
    Logger.success("Bot disconnected successfully.");
  } catch (err) {
    Logger.error("Error during shutdown", err);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Start Bot ───────────────────────────────────────────────────────────────

(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    Logger.error(`Startup error: ${error.message}`);
    process.exit(1);
  }
})();

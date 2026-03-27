const { EmbedBuilder, WebhookClient } = require("discord.js");

/** @type {Map<string, WebhookClient>} */
const webhookCache = new Map();

/**
 * Get or create a cached WebhookClient from a URL
 * @param {string} url
 * @returns {WebhookClient|null}
 */
function getWebhook(url) {
  if (!url) return null;
  if (webhookCache.has(url)) return webhookCache.get(url);
  try {
    const client = new WebhookClient({ url });
    webhookCache.set(url, client);
    return client;
  } catch {
    console.warn(`[WebhookLogger] Invalid webhook URL: ${url.slice(0, 40)}...`);
    return null;
  }
}

/**
 * Send an embed to a webhook
 * @param {string} webhookUrl
 * @param {EmbedBuilder} embed
 */
async function sendWebhook(webhookUrl, embed) {
  const webhook = getWebhook(webhookUrl);
  if (!webhook) return;
  try {
    await webhook.send({ embeds: [embed] });
  } catch (ex) {
    console.error(`[WebhookLogger] Failed to send webhook: ${ex.message}`);
  }
}

module.exports = class WebhookLogger {
  /**
   * Log an error to the error webhook
   * @param {string} errorMsg
   * @param {object} [ex]
   */
  static async logError(errorMsg, ex) {
    const url = process.env.ERROR_LOG_WEBHOOK;
    if (!url) return;

    const stack = ex?.stack ? `\`\`\`\n${ex.stack.slice(0, 1500)}\n\`\`\`` : "";

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setAuthor({ name: "Error Log" })
      .setDescription(`**${errorMsg}**\n${ex?.message || ""}\n${stack}`)
      .setTimestamp();

    await sendWebhook(url, embed);
  }

  /**
   * Log bot joining a server
   * @param {import("discord.js").Guild} guild
   * @param {import("discord.js").Client} client
   */
  static async logGuildJoin(guild, client) {
    const url = process.env.GUILD_LOG_WEBHOOK;
    if (!url) return;

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setAuthor({ name: "Server Joined" })
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Server", value: `${guild.name} (\`${guild.id}\`)`, inline: false },
        { name: "Owner", value: owner ? `${owner.user.tag} (\`${owner.id}\`)` : "Unknown", inline: true },
        { name: "Members", value: `\`${guild.memberCount}\``, inline: true },
        { name: "Total Servers", value: `\`${client.guilds.cache.size}\``, inline: true },
      )
      .setFooter({ text: `Server #${client.guilds.cache.size}` })
      .setTimestamp();

    await sendWebhook(url, embed);
  }

  /**
   * Log bot leaving/being removed from a server
   * @param {import("discord.js").Guild} guild
   * @param {import("discord.js").Client} client
   */
  static async logGuildLeave(guild, client) {
    const url = process.env.GUILD_LOG_WEBHOOK;
    if (!url) return;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setAuthor({ name: "Server Left" })
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Server", value: `${guild.name} (\`${guild.id}\`)`, inline: false },
        { name: "Members", value: `\`${guild.memberCount}\``, inline: true },
        { name: "Total Servers", value: `\`${client.guilds.cache.size}\``, inline: true },
      )
      .setTimestamp();

    await sendWebhook(url, embed);
  }
};

const { GiveawaysManager } = require("discord-giveaways");
const giveawayStore = require("@src/database/giveaways");

class JsonGiveawaysManager extends GiveawaysManager {
  /**
   * @param {import("@structures/BotClient")} client
   */
  constructor(client) {
    super(
      client,
      {
        default: {
          botsCanWin: false,
          embedColor: client.config.GIVEAWAYS?.START_EMBED || "#5865F2",
          embedColorEnd: client.config.GIVEAWAYS?.END_EMBED || "#2B2D31",
          reaction: client.config.GIVEAWAYS?.REACTION || "🎁",
        },
      },
      false
    );
  }

  async getAllGiveaways() {
    return giveawayStore.getAllGiveaways();
  }

  async saveGiveaway(messageId, giveawayData) {
    giveawayStore.saveGiveaway(messageId, giveawayData);
    return true;
  }

  async editGiveaway(messageId, giveawayData) {
    giveawayStore.editGiveaway(messageId, giveawayData);
    return true;
  }

  async deleteGiveaway(messageId) {
    giveawayStore.deleteGiveaway(messageId);
    return true;
  }
}

module.exports = (client) => new JsonGiveawaysManager(client);
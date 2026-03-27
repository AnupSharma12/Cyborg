const { EmbedBuilder } = require("discord.js");

const EMBED_COLORS = {
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
  WARNING: 0xfee75c,
  BOT_EMBED: 0x5865f2,
};

module.exports = class EmbedUtils {
  static success(description) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(`\u2705 | ${description}`);
  }

  static error(description) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`\u274c | ${description}`);
  }

  static warning(description) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.WARNING)
      .setDescription(`\u26a0\ufe0f | ${description}`);
  }

  static embed() {
    return new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED);
  }

  static get COLORS() {
    return EMBED_COLORS;
  }
};

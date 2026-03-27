const { ApplicationCommandOptionType } = require("discord.js");
const { randomInt } = require("node:crypto");
const EmbedUtils = require("@helpers/EmbedUtils");

const NORMAL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_,;.?!/\\'0123456789";
const FLIPPED = "\u2200q\u03bd\u15d1\u018e\u2132\u0183HI\u017f\u029e\u02e5WNO\u0500\u1f49\u1d1aS\u22a5\u2229\u039bMX\u028eZ\u0250q\u0254p\u01dd\u025f\u0183\u0265\u0131\u0638\u029e\u05df\u026fuodb\u0279s\u0287n\u028c\u028dx\u028ez\u203e\u2018\u061b\u02d9\u00bf\u00a1/\\,0\u0196\u1205\u0190\u3123\u03db9\u3125860";

function flipText(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const idx = NORMAL.indexOf(text.charAt(i));
    result += idx !== -1 ? FLIPPED.charAt(idx) : text.charAt(i);
  }
  return result;
}

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "flip",
  description: "Flip a coin or flip text upside down",
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    usage: "<coin|text> [input]",
    subcommands: [
      {
        trigger: "coin",
        description: "Flip a coin — heads or tails",
      },
      {
        trigger: "text <input>",
        description: "Flip text upside down",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "coin",
        description: "Flip a coin — heads or tails",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "text",
        description: "Flip text upside down",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "input",
            description: "The text to flip",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if (sub === "coin") {
      const toss = randomInt(2) === 0 ? "HEADS" : "TAILS";

      const sent = await message.channel.send({
        embeds: [EmbedUtils.embed().setDescription(`${message.author.username} flipped a coin...`)],
      });

      setTimeout(() => {
        sent.edit({ embeds: [EmbedUtils.embed().setDescription("\uD83E\uDE99 The coin is in the air...")] }).catch(() => {});
        setTimeout(() => {
          sent.edit({
            embeds: [
              EmbedUtils.embed()
                .setDescription(`\uD83E\uDE99 **${toss}!**`)
                .setImage(toss === "HEADS" ? "https://i.imgur.com/xzNU49F.png" : "https://i.imgur.com/9fyiAYl.png"),
            ],
          }).catch(() => {});
        }, 2000);
      }, 2000);
    } else if (sub === "text") {
      if (args.length < 2) return message.reply({ embeds: [EmbedUtils.error("Please provide text to flip.")] });
      const input = args.slice(1).join(" ");
      const flipped = flipText(input);
      await message.reply({ embeds: [EmbedUtils.embed().setDescription(flipped)] });
    } else {
      await message.reply({ embeds: [EmbedUtils.error("Use `flip coin` or `flip text <input>`")] });
    }
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "coin") {
      const toss = randomInt(2) === 0 ? "HEADS" : "TAILS";

      await interaction.followUp({
        embeds: [EmbedUtils.embed().setDescription(`${interaction.user.username} flipped a coin...`)],
      });

      setTimeout(() => {
        interaction.editReply({ embeds: [EmbedUtils.embed().setDescription("\uD83E\uDE99 The coin is in the air...")] }).catch(() => {});
        setTimeout(() => {
          interaction.editReply({
            embeds: [
              EmbedUtils.embed()
                .setDescription(`\uD83E\uDE99 **${toss}!**`)
                .setImage(toss === "HEADS" ? "https://i.imgur.com/xzNU49F.png" : "https://i.imgur.com/9fyiAYl.png"),
            ],
          }).catch(() => {});
        }, 2000);
      }, 2000);
    } else if (sub === "text") {
      const input = interaction.options.getString("input");
      const flipped = flipText(input);
      await interaction.followUp({ embeds: [EmbedUtils.embed().setDescription(flipped)] });
    }
  },
};

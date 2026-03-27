const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "hack",
  description: "Fake hacking simulation on a user",
  category: "FUN",
  cooldown: 10,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<@user>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to hack",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.users.first() || (await message.client.users.fetch(args[0]).catch(() => null));
    if (!target) return message.reply({ embeds: [EmbedUtils.error("Please mention a valid user.")] });
    if (target.bot) return message.reply({ embeds: [EmbedUtils.error("You cannot hack a bot!")] });
    await runHack(message, null, target);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    if (target.bot) return interaction.followUp({ embeds: [EmbedUtils.error("You cannot hack a bot!")] });
    await runHack(null, interaction, target);
  },
};

async function runHack(message, interaction, target) {
  const stages = [
    `Hacking ${target.toString()}....`,
    `Gaining access to ${target.toString()}'s secure server...`,
    `Bypassing firewalls and encryption...`,
    `Extracting confidential information...`,
    `Accessing personal emails...`,
    `Email: ${target.username.toLowerCase()}@gmail.com\nPassword: ********`,
    `Analyzing social media accounts...`,
    `Successfully found 13 account info.`,
    `Locating hidden files...`,
    `Files found: 15`,
    `Hacking complete. All information sent in your DMs!`,
  ];

  const embed = EmbedUtils.embed().setTitle("🖥️ Hacking in Progress...").setDescription(stages[0]);

  let msg;
  if (message) {
    msg = await message.reply({ embeds: [embed] });
  } else {
    msg = await interaction.followUp({ embeds: [embed] });
  }

  for (let i = 1; i < stages.length; i++) {
    await sleep(2000);
    const updated = EmbedUtils.embed().setTitle("🖥️ Hacking in Progress...").setDescription(stages[i]);
    await msg.edit({ embeds: [updated] }).catch(() => {});
  }

  const resultsEmbed = EmbedUtils.success()
    .setTitle("🎯 Hacking Results")
    .setDescription(`Here's what we found about ${target.toString()}:`)
    .addFields({
      name: "Personal Information",
      value: "Never gonna give you up\nNever gonna let you down\nNever gonna run around and desert you!",
    })
    .setImage("https://media.tenor.com/x8v1oNUOmg4AAAAd/rickroll-roll.gif")
    .setFooter({ text: "Get Rick Rolled! 🎵" });

  const sender = message ? message.author : interaction.user;
  try {
    await sender.send({ embeds: [resultsEmbed] });
    const finalEmbed = EmbedUtils.success().setTitle("✅ Hack Complete!").setDescription("Check your DMs for the results! 📨");
    await msg.edit({ embeds: [finalEmbed] }).catch(() => {});
  } catch {
    await msg.edit({ content: "Couldn't send you the results in DM, so here they are:", embeds: [resultsEmbed] }).catch(() => {});
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

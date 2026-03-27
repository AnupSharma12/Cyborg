const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { PREFIX_COMMANDS } = require("@root/config");
const CommandCategory = require("@structures/CommandCategory");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "help",
  description: "List all commands or get info about a specific command",
  category: "INFORMATION",
  command: {
    enabled: true,
    usage: "[command]",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "command",
        description: "The command to get info about",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const { client } = message;
    const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;

    if (args[0]) {
      const cmd = client.getCommand(args[0].toLowerCase());
      if (!cmd) return message.reply({ embeds: [EmbedUtils.error(`No command found for \`${args[0]}\``)] });
      return message.reply({ embeds: [getCommandHelp(cmd, prefix, client)] });
    }

    const embed = getCategoryList(client, prefix);
    await message.reply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const { client } = interaction;
    const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;
    const cmdName = interaction.options.getString("command");

    if (cmdName) {
      const cmd = client.getCommand(cmdName.toLowerCase()) || client.slashCommands.get(cmdName.toLowerCase());
      if (!cmd) return interaction.followUp({ embeds: [EmbedUtils.error(`No command found for \`${cmdName}\``)] });
      return interaction.followUp({ embeds: [getCommandHelp(cmd, prefix, client)] });
    }

    const embed = getCategoryList(client, prefix);
    await interaction.followUp({ embeds: [embed] });
  },
};

function getCategoryList(client, prefix) {
  const categories = {};

  for (const cmd of client.commands) {
    const cat = cmd.category || "NONE";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd.name);
  }

  // Also include slash-only commands
  client.slashCommands.forEach((cmd) => {
    const cat = cmd.category || "NONE";
    if (!categories[cat]) categories[cat] = [];
    if (!categories[cat].includes(cmd.name)) categories[cat].push(cmd.name);
  });

  const embed = EmbedUtils.embed()
    .setAuthor({ name: `${client.user.username} — Commands`, iconURL: client.user.displayAvatarURL() })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `Use ${prefix}help <command> or /help <command> for details` });

  for (const [cat, cmds] of Object.entries(categories).sort()) {
    const catInfo = CommandCategory[cat] || CommandCategory.NONE;
    embed.addFields({
      name: `${catInfo.emoji} ${catInfo.name}`,
      value: cmds.map((c) => `\`${c}\``).join(", "),
    });
  }

  return embed;
}

function getCommandHelp(cmd, prefix, client) {
  const embed = EmbedUtils.embed()
    .setAuthor({ name: `Command: ${cmd.name}`, iconURL: client.user.displayAvatarURL() })
    .setDescription(cmd.description || "No description provided.");

  if (cmd.command?.enabled) {
    let usage = `\`${prefix}${cmd.name} ${cmd.command.usage || ""}\``;
    if (cmd.command.subcommands?.length > 0) {
      usage = cmd.command.subcommands
        .map((sub) => `\`${prefix}${cmd.name} ${sub.trigger}\` — ${sub.description}`)
        .join("\n");
    }
    embed.addFields({ name: "Prefix Usage", value: usage });
  }

  if (cmd.slashCommand?.enabled) {
    embed.addFields({ name: "Slash Command", value: `\`/${cmd.name}\`` });
  }

  if (cmd.command?.aliases?.length > 0) {
    embed.addFields({ name: "Aliases", value: cmd.command.aliases.map((a) => `\`${a}\``).join(", "), inline: true });
  }

  const catInfo = CommandCategory[cmd.category] || CommandCategory.NONE;
  embed.addFields({ name: "Category", value: `${catInfo.emoji} ${catInfo.name}`, inline: true });

  if (cmd.cooldown) {
    embed.addFields({ name: "Cooldown", value: `${cmd.cooldown}s`, inline: true });
  }

  return embed;
}

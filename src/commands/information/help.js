const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");
const { PREFIX_COMMANDS, SUPPORT_SERVER } = require("@root/config");
const CommandCategory = require("@structures/CommandCategory");

const IDLE_TIMEOUT = 60_000; // 60 seconds before collector expires

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "help",
  description: "List all commands or get info about a specific command",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[command]",
    aliases: ["h", "commands"],
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
      const cmd = client.getCommand(args[0].toLowerCase()) || client.slashCommands.get(args[0].toLowerCase());
      if (!cmd) return message.reply({ embeds: [EmbedUtils.error(`No command found for \`${args[0]}\``)] });
      return message.reply({ embeds: [getCommandHelp(cmd, prefix, client)] });
    }

    const categories = buildCategories(client);
    const embed = getMainMenu(client, categories);
    const row = getSelectMenu(categories);
    const buttons = getButtons();

    const reply = await message.reply({ embeds: [embed], components: [row, buttons] });
    return handleCollector(reply, message.author.id, client, prefix, categories);
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

    const categories = buildCategories(client);
    const embed = getMainMenu(client, categories);
    const row = getSelectMenu(categories);
    const buttons = getButtons();

    const reply = await interaction.followUp({ embeds: [embed], components: [row, buttons], fetchReply: true });
    return handleCollector(reply, interaction.user.id, client, prefix, categories);
  },
};

// ─── Build Categories Map ────────────────────────────────────────────────────

function buildCategories(client) {
  const categories = {};

  for (const cmd of client.commands) {
    const cat = cmd.category || "NONE";
    if (!categories[cat]) categories[cat] = [];
    if (!categories[cat].find((c) => c.name === cmd.name)) {
      categories[cat].push({ name: cmd.name, description: cmd.description });
    }
  }

  client.slashCommands.forEach((cmd) => {
    const cat = cmd.category || "NONE";
    if (!categories[cat]) categories[cat] = [];
    if (!categories[cat].find((c) => c.name === cmd.name)) {
      categories[cat].push({ name: cmd.name, description: cmd.description });
    }
  });

  // Sort commands within each category
  for (const cat of Object.keys(categories)) {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  return categories;
}

// ─── Main Menu Embed ─────────────────────────────────────────────────────────

function getMainMenu(client, categories) {
  const prefix = PREFIX_COMMANDS.DEFAULT_PREFIX;
  const totalCommands = new Set([
    ...client.commands.map((c) => c.name),
    ...client.slashCommands.map((c) => c.name),
  ]).size;

  const embed = EmbedUtils.embed()
    .setAuthor({ name: `${client.user.username} — Help Menu`, iconURL: client.user.displayAvatarURL() })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setDescription(
      `Hey! I'm **${client.user.username}**, a feature-rich Discord bot with **${totalCommands}** commands across **${Object.keys(categories).length}** categories.\n\n` +
      `> Use the **dropdown menu** below to browse commands by category.\n` +
      `> Use \`${prefix}help <command>\` or \`/help <command>\` for details on a specific command.\n`
    );

  // Add category overview fields
  const sortedCats = Object.entries(categories).sort(([a], [b]) => {
    const order = ["INFORMATION", "MODERATION", "AUTOMOD", "GIVEAWAY", "MUSIC", "FUN", "ANIME", "IMAGE", "UTILITY", "ADMIN", "OWNER", "NONE"];
    return order.indexOf(a) - order.indexOf(b);
  });

  for (const [cat, cmds] of sortedCats) {
    const catInfo = CommandCategory[cat] || CommandCategory.NONE;
    embed.addFields({
      name: `${catInfo.emoji} ${catInfo.name} [${cmds.length}]`,
      value: catInfo.description || "No description",
      inline: true,
    });
  }

  if (SUPPORT_SERVER) {
    embed.addFields({ name: "\u200b", value: `[Support Server](${SUPPORT_SERVER})`, inline: false });
  }

  embed.setFooter({ text: `Total: ${totalCommands} commands • Prefix: ${prefix}` });

  return embed;
}

// ─── Category Embed ──────────────────────────────────────────────────────────

function getCategoryEmbed(client, categoryKey, categories, prefix) {
  const catInfo = CommandCategory[categoryKey] || CommandCategory.NONE;
  const cmds = categories[categoryKey] || [];

  const embed = EmbedUtils.embed()
    .setAuthor({ name: `${catInfo.emoji} ${catInfo.name} Commands`, iconURL: client.user.displayAvatarURL() })
    .setDescription(catInfo.description || "No description")
    .setFooter({ text: `${cmds.length} commands • Use ${prefix}help <command> for details` });

  if (cmds.length === 0) {
    embed.addFields({ name: "No Commands", value: "This category has no commands yet." });
    return embed;
  }

  // Split commands into columns of up to 10 for cleaner display
  const chunkSize = 10;
  for (let i = 0; i < cmds.length; i += chunkSize) {
    const chunk = cmds.slice(i, i + chunkSize);
    const fieldName = cmds.length > chunkSize ? `Commands [${i + 1}-${i + chunk.length}]` : "Commands";
    embed.addFields({
      name: fieldName,
      value: chunk.map((c) => `\`${c.name}\` — ${c.description}`).join("\n"),
    });
  }

  return embed;
}

// ─── Command Detail Embed ────────────────────────────────────────────────────

function getCommandHelp(cmd, prefix, client) {
  const catInfo = CommandCategory[cmd.category] || CommandCategory.NONE;

  const embed = EmbedUtils.embed()
    .setAuthor({ name: `Command: ${cmd.name}`, iconURL: client.user.displayAvatarURL() })
    .setDescription(cmd.description || "No description provided.")
    .setFooter({ text: `Category: ${catInfo.name}` });

  // Prefix usage
  if (cmd.command?.enabled) {
    let usage = `\`${prefix}${cmd.name} ${cmd.command.usage || ""}\``;
    if (cmd.command.subcommands?.length > 0) {
      usage = cmd.command.subcommands
        .map((sub) => `\`${prefix}${cmd.name} ${sub.trigger}\` — ${sub.description}`)
        .join("\n");
    }
    embed.addFields({ name: "📝 Prefix Usage", value: usage });
  }

  // Slash command
  if (cmd.slashCommand?.enabled) {
    embed.addFields({ name: "🔹 Slash Command", value: `\`/${cmd.name}\``, inline: true });
  }

  // Aliases
  if (cmd.command?.aliases?.length > 0) {
    embed.addFields({ name: "🏷️ Aliases", value: cmd.command.aliases.map((a) => `\`${a}\``).join(", "), inline: true });
  }

  // Category
  embed.addFields({ name: "📂 Category", value: `${catInfo.emoji} ${catInfo.name}`, inline: true });

  // Cooldown
  if (cmd.cooldown) {
    embed.addFields({ name: "⏱️ Cooldown", value: `${cmd.cooldown}s`, inline: true });
  }

  // Permissions
  if (cmd.userPermissions?.length > 0) {
    embed.addFields({ name: "👤 Required Permissions", value: cmd.userPermissions.map((p) => `\`${p}\``).join(", "), inline: true });
  }
  if (cmd.botPermissions?.length > 0) {
    embed.addFields({ name: "🤖 Bot Permissions", value: cmd.botPermissions.map((p) => `\`${p}\``).join(", "), inline: true });
  }

  return embed;
}

// ─── Select Menu ─────────────────────────────────────────────────────────────

function getSelectMenu(categories) {
  const order = ["INFORMATION", "MODERATION", "AUTOMOD", "GIVEAWAY", "MUSIC", "FUN", "ANIME", "IMAGE", "UTILITY", "ADMIN", "OWNER", "NONE"];
  const sortedKeys = Object.keys(categories).sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const options = sortedKeys.map((cat) => {
    const catInfo = CommandCategory[cat] || CommandCategory.NONE;
    return {
      label: `${catInfo.name} [${categories[cat].length}]`,
      value: cat,
      description: (catInfo.description || "").slice(0, 100),
      emoji: catInfo.emoji,
    };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("help-category-select")
    .setPlaceholder("Select a category to browse commands")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

function getButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("help-home")
      .setLabel("Home")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("help-close")
      .setLabel("Close")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );
}

// ─── Interaction Collector ───────────────────────────────────────────────────

function handleCollector(reply, authorId, client, prefix, categories) {
  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === authorId,
    time: IDLE_TIMEOUT,
    idle: IDLE_TIMEOUT,
  });

  collector.on("collect", async (i) => {
    try {
      await i.deferUpdate();

      if (i.customId === "help-home") {
        const embed = getMainMenu(client, categories);
        await i.editReply({ embeds: [embed] });
      } else if (i.customId === "help-close") {
        collector.stop("closed");
        await i.editReply({ components: [] }).catch(() => {});
      } else if (i.customId === "help-category-select") {
        const selected = i.values[0];
        const embed = getCategoryEmbed(client, selected, categories, prefix);
        await i.editReply({ embeds: [embed] });
      }
    } catch {
      // Interaction may have expired
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "closed") {
      try {
        await reply.edit({ components: [] }).catch(() => {});
      } catch {
        // Message may have been deleted
      }
    }
  });
}

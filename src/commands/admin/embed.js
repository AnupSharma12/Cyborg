const {
  ApplicationCommandOptionType,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

module.exports = {
  name: "embed",
  description: "Create custom embed messages",
  category: "ADMIN",
  botPermissions: ["EmbedLinks", "SendMessages"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<#channel|channel_id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "Channel where the embed setup message will be posted",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply({ embeds: [EmbedUtils.error("Please provide a valid text channel.")] });
    }

    if (!canSendEmbeds(channel, message.guild.members.me)) {
      return message.reply({ embeds: [EmbedUtils.error("I do not have permission to send embeds in that channel.")] });
    }

    await message.reply({ embeds: [EmbedUtils.success(`Embed setup started in ${channel}.`)] });
    await runEmbedSetup(channel, message.author.id);
  },

  async interactionRun(interaction) {
    const channel = interaction.options.getChannel("channel");

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.followUp({ embeds: [EmbedUtils.error("Please provide a valid text channel.")] });
    }

    if (!canSendEmbeds(channel, interaction.guild.members.me)) {
      return interaction.followUp({ embeds: [EmbedUtils.error("I do not have permission to send embeds in that channel.")] });
    }

    await interaction.followUp({ embeds: [EmbedUtils.success(`Embed setup started in ${channel}.`)] });
    await runEmbedSetup(channel, interaction.user.id);
  },
};

function canSendEmbeds(channel, me) {
  const perms = channel.permissionsFor(me);
  return perms?.has(["ViewChannel", "SendMessages", "EmbedLinks"]);
}

function isValidEmbedColor(input) {
  if (!input) return false;
  return /^#?[0-9a-fA-F]{6}$/.test(input.trim());
}

function normalizeHex(input) {
  return input.startsWith("#") ? input : `#${input}`;
}

async function runEmbedSetup(channel, userId) {
  const sentMsg = await channel.send({
    content: "Click the button below to create an embed.",
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("EMBED_ADD")
          .setLabel("Create Embed")
          .setStyle(ButtonStyle.Primary)
      ),
    ],
  });

  const setupButton = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "EMBED_ADD" && i.user.id === userId && i.message.id === sentMsg.id,
      time: 60_000,
    })
    .catch(() => null);

  if (!setupButton) {
    await sentMsg.edit({ content: "No response received, setup cancelled.", components: [] });
    return;
  }

  await setupButton.showModal(
    new ModalBuilder({
      customId: "EMBED_MODAL",
      title: "Embed Generator",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Embed Title")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("author")
            .setLabel("Embed Author")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Embed Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Embed Color (hex)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Embed Footer")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );

  const modal = await setupButton
    .awaitModalSubmit({
      time: 120_000,
      filter: (m) => m.customId === "EMBED_MODAL" && m.user.id === userId,
    })
    .catch(() => null);

  if (!modal) {
    await sentMsg.edit({ content: "No response received, setup cancelled.", components: [] });
    return;
  }

  await modal.reply({ content: "Embed setup accepted.", ephemeral: true }).catch(() => {});

  const title = modal.fields.getTextInputValue("title");
  const author = modal.fields.getTextInputValue("author");
  const description = modal.fields.getTextInputValue("description");
  const footer = modal.fields.getTextInputValue("footer");
  const color = modal.fields.getTextInputValue("color").trim();

  if (!title && !author && !description && !footer) {
    await sentMsg.edit({ content: "You cannot send an empty embed.", components: [] });
    return;
  }

  const embed = new EmbedBuilder();
  if (title) embed.setTitle(title);
  if (author) embed.setAuthor({ name: author });
  if (description) embed.setDescription(description);
  if (footer) embed.setFooter({ text: footer });
  if (isValidEmbedColor(color)) embed.setColor(normalizeHex(color));

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("EMBED_FIELD_ADD")
      .setLabel("Add Field")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("EMBED_FIELD_REM")
      .setLabel("Remove Field")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("EMBED_FIELD_DONE")
      .setLabel("Done")
      .setStyle(ButtonStyle.Primary)
  );

  await sentMsg.edit({
    content: "Add or remove fields, then click Done.",
    embeds: [embed],
    components: [buttonRow],
  });

  const collector = sentMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === userId,
    idle: 300_000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "EMBED_FIELD_ADD") {
      await interaction.showModal(
        new ModalBuilder({
          customId: "EMBED_ADD_FIELD_MODAL",
          title: "Add Embed Field",
          components: [
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("name")
                .setLabel("Field Name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("value")
                .setLabel("Field Value")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("inline")
                .setLabel("Inline? (true/false)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setValue("true")
            ),
          ],
        })
      );

      const fieldModal = await interaction
        .awaitModalSubmit({
          time: 300_000,
          filter: (m) => m.customId === "EMBED_ADD_FIELD_MODAL" && m.user.id === userId,
        })
        .catch(() => null);

      if (!fieldModal) {
        collector.stop("timeout");
        return;
      }

      const name = fieldModal.fields.getTextInputValue("name");
      const value = fieldModal.fields.getTextInputValue("value");
      const rawInline = fieldModal.fields.getTextInputValue("inline").trim().toLowerCase();
      const inline = rawInline === "false" ? false : true;

      const fields = embed.data.fields || [];
      fields.push({ name, value, inline });
      embed.setFields(fields);

      await fieldModal.reply({ content: "Field added.", ephemeral: true }).catch(() => {});
      await sentMsg.edit({ embeds: [embed] }).catch(() => {});
      return;
    }

    if (interaction.customId === "EMBED_FIELD_REM") {
      const fields = [...(embed.data.fields || [])];
      if (fields.length > 0) {
        fields.pop();
        embed.setFields(fields);
        await interaction.reply({ content: "Last field removed.", ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: "There are no fields to remove.", ephemeral: true }).catch(() => {});
      }

      await sentMsg.edit({ embeds: [embed] }).catch(() => {});
      return;
    }

    if (interaction.customId === "EMBED_FIELD_DONE") {
      await interaction.reply({ content: "Embed finalized.", ephemeral: true }).catch(() => {});
      collector.stop("done");
    }
  });

  collector.on("end", async () => {
    await sentMsg.edit({ content: "", components: [] }).catch(() => {});
  });
}

const { ApplicationCommandOptionType } = require("discord.js");
const EmbedUtils = require("@helpers/EmbedUtils");

const MAX_FIELD = 1024;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "urban",
  description: "Search Urban Dictionary for a term",
  category: "UTILITY",
  cooldown: 3,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<term>",
    minArgsCount: 1,
    aliases: ["ud", "urbandictionary"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "term",
        description: "The word or phrase to search",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const term = args.join(" ").trim();
    if (!term) {
      return message.reply({
        embeds: [EmbedUtils.error("Please provide a term to search. Usage: `!urban <term>`")],
      });
    }

    return handleLookup({
      term,
      requester: message.author,
      send: (payload) => message.reply(payload),
    });
  },

  async interactionRun(interaction) {
    const term = interaction.options.getString("term", true).trim();
    return handleLookup({
      term,
      requester: interaction.user,
      send: (payload) => interaction.followUp(payload),
    });
  },
};

async function handleLookup({ term, requester, send }) {
  try {
    const result = await fetchUrbanDefinition(term);
    if (!result) {
      return send({
        embeds: [EmbedUtils.error(`No Urban Dictionary results found for **${term}**.`)],
      });
    }

    return send({
      embeds: [buildUrbanEmbed(result, requester)],
    });
  } catch (error) {
    return send({
      embeds: [EmbedUtils.error("Urban lookup failed. Please try again in a moment.")],
    });
  }
}

async function fetchUrbanDefinition(term) {
  const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Urban API request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
    return null;
  }

  // Prefer the best-rated entry by net votes.
  return data.list
    .slice()
    .sort((a, b) => (b.thumbs_up - b.thumbs_down) - (a.thumbs_up - a.thumbs_down))[0];
}

function buildUrbanEmbed(entry, requester) {
  const word = entry.word || "Urban Result";
  const definition = truncate(cleanUrbanText(entry.definition || "No definition provided."), MAX_FIELD);
  const example = truncate(cleanUrbanText(entry.example || "No example provided."), MAX_FIELD);
  const permalink = entry.permalink || "https://www.urbandictionary.com/";

  return EmbedUtils.embed()
    .setTitle(`Urban: ${word}`)
    .setURL(permalink)
    .addFields(
      { name: "Definition", value: definition, inline: false },
      { name: "Example", value: example, inline: false },
      {
        name: "Votes",
        value: `👍 ${entry.thumbs_up ?? 0} | 👎 ${entry.thumbs_down ?? 0}`,
        inline: true,
      },
      {
        name: "Author",
        value: entry.author ? truncate(entry.author, 64) : "Unknown",
        inline: true,
      }
    )
    .setFooter({
      text: `Requested by ${requester.username}`,
      iconURL: requester.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();
}

function cleanUrbanText(text) {
  // Urban wraps linked words in [brackets]; flatten them for cleaner Discord output.
  return text.replace(/\[(.+?)\]/g, "$1").trim();
}

function truncate(text, limit) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 3)}...`;
}

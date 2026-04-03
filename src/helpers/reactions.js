const EmbedUtils = require("@helpers/EmbedUtils");

const REACTIONS = {
  hug: { emoji: "🤗", verb: "hugged", api: "hug" },
  kiss: { emoji: "💋", verb: "kissed", api: "kiss" },
  slap: { emoji: "👋", verb: "slapped", api: "slap" },
  pat: { emoji: "✋", verb: "patted", api: "pat" },
  cuddle: { emoji: "🥰", verb: "cuddled with", api: "cuddle" },
  poke: { emoji: "👉", verb: "poked", api: "poke" },
  tickle: { emoji: "😆", verb: "tickled", api: "tickle" },
  feed: { emoji: "🍔", verb: "fed", api: "feed" },
  smug: { emoji: "😏", verb: null, api: "smug" },
  wink: { emoji: "😉", verb: null, api: "wink" },
};

async function getReactionGif(type) {
  const reaction = REACTIONS[type];
  if (!reaction || !reaction.api) return null;
  try {
    const res = await fetch(`https://api.otakugifs.xyz/gif?reaction=${reaction.api}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.url || null;
  } catch (error) {
    console.error(`[ReactionGif] Failed to fetch ${type}:`, error.message);
    return null;
  }
}

function buildReactionEmbed(type, user, target) {
  const reaction = REACTIONS[type];
  if (!reaction) return EmbedUtils.error("Unknown reaction type.");
  return { reaction, getGif: () => getReactionGif(type), user, target };
}

module.exports = { REACTIONS, getReactionGif };
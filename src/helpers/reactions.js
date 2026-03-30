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
  wink: { emoji: "😉", verb: null, api: null },
};

async function getReactionGif(type) {
  const reaction = REACTIONS[type];
  if (!reaction) return null;
  try {
    let url;
    if (type === "wink") {
      const res = await fetch("https://some-random-api.com/animu/wink", { signal: AbortSignal.timeout(10_000) });
      const json = await res.json();
      url = json.link;
    } else {
      const res = await fetch(`https://nekos.life/api/v2/img/${reaction.api}`, { signal: AbortSignal.timeout(10_000) });
      const json = await res.json();
      url = json.url;
    }
    return url || null;
  } catch {
    return null;
  }
}

function buildReactionEmbed(type, user, target) {
  const reaction = REACTIONS[type];
  if (!reaction) return EmbedUtils.error("Unknown reaction type.");
  return { reaction, getGif: () => getReactionGif(type), user, target };
}

module.exports = { REACTIONS, getReactionGif };
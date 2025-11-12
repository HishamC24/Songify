/**
 * Songify backend – OpenRouter single-model version
 */
import { debug } from "../globalSettings.js";

const OPENROUTER_API_KEY = ""; // ⬅️ your key here
const RECENT_HISTORY_LIMIT = 10;
let recentSongs = [];
let cachedMCP = null;

// ======== Default fallback songs ========
export let songs = [
  "Can't Hold Us - Macklemore",
  "GTA 2 - Rarin",
  "Assumptions - Sam Gellaitry",
  "Levitating - Dua Lipa",
  "Loyal - ODESZA",
  "How Long - Charlie Puth",
  "Not Like Us - Kendrick Lamar",
  "Adventure of a Lifetime - Coldplay",
  "Treasure - Bruno Mars",
  "September - Earth, Wind & Fire",
  "Higher Love - Kygo & Whitney Houston",
  "Walking on a Dream - Empire of the Sun",
  "Classic - MKTO",
  "Good Day for Living - Rascal Flatts",
  "Cake By The Ocean - DNCE",
  "Come and Get Your Love - Redbone",
  "Take On Me - a-ha",
  "Can't Stop The Feeling! - Justin Timberlake",
  "Shut Up and Dance - WALK THE MOON"
];

// ======== Default vector example ========
const tasteVector = {
  genreIdentity: [0.812, 0.327, 0.438, 0.701, 0.529, 0.243, 0.892, 0.115, 0.674, 0.801, 0.318],
  artistVariety: 0.713,
  eraPreference: 0.624,
  explicitnessTolerance: 0.497,
  popularityBias: 0.304,
  energyPreference: 0.883
};

// ======== Helper to load MCP once ========
async function getMCP() {
  if (cachedMCP) return cachedMCP;
  const res = await fetch("./backend/songify_mcp_v1.json");
  cachedMCP = await res.json();

  if (debug) console.log(`🧠 MCP loaded once: ${cachedMCP.name} v${cachedMCP.version}`);

  return cachedMCP;
}

// ======== Build the LLM prompt ========
function buildPrompt(MCP, vector) {
  return `
${MCP.context.instructions.join("\n")}

Use this genre key mapping:
${JSON.stringify(MCP.context.genre_key, null, 2)}

Taste vector:
${JSON.stringify(vector, null, 2)}

Avoid these songs (already suggested): ${recentSongs.join(", ")}

Return ONLY a JSON array with one unique new song suggestion like:
["Song - Artist"]
Ensure it is not in the list above.
Start with '[' and end with ']'. No markdown or prose.
`;
}

// ======== Parse AI output ========
function parseResponse(text) {
  try {
    const match = text.match(/\[.*?\]/s);
    if (!match) {
      if (debug) console.warn("⚠️ No JSON array found in output:", text);
      return null;
    }
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
    if (debug) console.warn("⚠️ Parsed but invalid format:", parsed);
    return null;
  } catch (err) {
    if (debug) console.warn("⚠️ parseResponse() failed:", err, "Full text:", text);
    return null;
  }
}

// ======== Main recommendSong() ========
export async function recommendSong(vector = tasteVector) {
  const model = "meta-llama/llama-3.3-70b-instruct:free";

  try {
    const MCP = await getMCP();

    const prompt = buildPrompt(MCP, vector);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://127.0.0.1:5500/",
        "X-Title": "Songify"
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              MCP.context.system_role ||
              "You are Songify, a music recommendation AI."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    const song = parseResponse(text);
    if (!song) throw new Error("Invalid AI output format");

    // Update local recent history
    if (!recentSongs.includes(song)) {
      recentSongs.push(song);
      if (recentSongs.length > RECENT_HISTORY_LIMIT) recentSongs.shift();
      if (debug) console.log("🕒 Updated recentSongs:", recentSongs);
    }

    if (debug) console.log("🎧 Recommended song:", song);
    return song;

  } catch (err) {
    if (debug) console.error("⚠️ OpenRouter error:", err);
    const fallback = songs[Math.floor(Math.random() * songs.length)];
    if (debug) console.log("🎵 Using fallback:", fallback);
    return fallback;
  }
}




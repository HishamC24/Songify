/**
 * Songify backend – OpenRouter (5-song version)
 */
import { debug } from "../globalSettings.js";


//changed api key to be detected in url for demo

const OPENROUTER_API_KEY = (() => {
  const params = new URLSearchParams(window.location.search);
  const keyFromURL = params.get("apiKey");
  if (keyFromURL) localStorage.setItem("OPENROUTER_API_KEY", keyFromURL);
  return keyFromURL || localStorage.getItem("OPENROUTER_API_KEY") || "";
})();



const RECENT_HISTORY_LIMIT = 20;
let recentSongs = [];
let cachedMCP = null;

// ======== Default fallback songs ========
export let songs = [
  "Can't Hold Us - Macklemore",
  "GTA 2 - Rarin",
  "Assumptions - Sam Gellaitry",
  "Levitating - Dua Lipa",
  "How Long - Charlie Puth",
];

// ======== Default vector example ========
const tasteVector = {
  genreIdentity: [0.812, 0.327, 0.438, 0.701, 0.529, 0.243, 0.892, 0.115, 0.674, 0.801, 0.318],
  artistVariety: 0.713,
  eraPreference: 0.624,
  explicitnessTolerance: 0.497,
  popularityBias: 0.304,
  energyPreference: 0.883,
};

// ======== Load MCP once ========
async function getMCP() {
  if (cachedMCP) return cachedMCP;

  const res = await fetch("./backend/songify_mcp_v1.json");
  cachedMCP = await res.json();

  if (debug) console.log(`🧠 MCP loaded: ${cachedMCP.name} v${cachedMCP.version}`);
  return cachedMCP;
}

// ======== Build prompt (now for 5 songs) ========
function buildPrompt(MCP, vector) {
  return `
${MCP.context.instructions.join("\n")}

Use this genre key mapping:
${JSON.stringify(MCP.context.genre_key, null, 2)}

Taste vector:
${JSON.stringify(vector, null, 2)}

Avoid these songs (already suggested): ${recentSongs.join(", ")}

⚠️ RETURN EXACTLY THIS FORMAT:
[
  "Song - Artist",
  "Song - Artist",
  "Song - Artist",
  "Song - Artist",
  "Song - Artist"
]

No prose, no markdown. Only a raw JSON array. Must contain **5 unique** new songs.
`.trim();
}

// ======== Parse AI response (array of 5 songs) ========
function parseResponse(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      if (debug) console.warn("⚠️ parseResponse(): No JSON array found.");
      return null;
    }

    const arr = JSON.parse(match[0]);

    if (Array.isArray(arr) && arr.every(s => typeof s === "string")) {
      return arr;
    }

    if (debug) console.warn("⚠️ parseResponse(): Unexpected format:", arr);
    return null;
  } catch (err) {
    if (debug) console.warn("⚠️ parseResponse() failed:", err);
    return null;
  }
}

/// models "meta-llama/llama-3.3-70b-instruct:free",

// ======== Main recommendSong() (returns array of 5) ========
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
        "X-Title": "Songify",
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: MCP.context.system_role || "You are Songify, a music recommendation AI.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    const songsFromAI = parseResponse(text);
    if (!songsFromAI) throw new Error("Invalid AI response");

    // Update history
    songsFromAI.forEach(song => {
      if (!recentSongs.includes(song)) {
        recentSongs.push(song);
        if (recentSongs.length > RECENT_HISTORY_LIMIT) recentSongs.shift();
      }
    });

    if (debug) console.log("🎧 AI returned 5 songs:", songsFromAI);
    return songsFromAI;

  } catch (err) {
    if (debug) console.error("⚠️ OpenRouter error:", err);

    // fallback: return 5 random local songs
    const fallback = [];
    for (let i = 0; i < 5; i++) {
      fallback.push(songs[Math.floor(Math.random() * songs.length)]);
    }

    if (debug) console.log("🎵 Using fallback list:", fallback);
    return fallback;
  }
}

// ====================================
// ========= LLM LOADED POPUP =========
// ====================================

function showLLMToast(message) {
  const toast = document.getElementById("llmToast");
  toast.textContent = message;

  // Show
  toast.classList.add("show");

  // Hide after 2 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

export async function testLLMConnection() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }]
      })
    });

    if (!response.ok) throw new Error();

    showLLMToast("Connected to LLM ✔️", true);
  } catch (e) {
    showLLMToast("Failed to connect to LLM ❌", false);
  }
}


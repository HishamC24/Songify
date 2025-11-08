/**
 * Songify backend – local + GitHub Pages version (OpenRouter.ai)
 * Works directly in browser, CORS-safe, no backend needed.
 */

const OPENROUTER_API_KEY = "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"; // ⬅️ your key
const RECENT_HISTORY_LIMIT = 10;
let recentSongs = [];

// Example fallback songs
export let songs = [
  "Can't Hold Us - Macklemore",
  "GTA 2 - Rarin",
  "Assumptions - Sam Gellaitry",
  "Levitating - Dua Lipa",
  "Loyal - Odesza",
  "How Long - Charlie Puth",
  "Hyperspace - Sam I"
];

// Example taste vector
const tasteVector = {
  genreIdentity: [0.812, 0.327, 0.438, 0.701, 0.529, 0.243, 0.892, 0.115, 0.674, 0.801, 0.318],
  artistVariety: 0.713,
  eraPreference: 0.624,
  explicitnessTolerance: 0.497,
  popularityBias: 0.304,
  energyPreference: 0.883
};

// ────────────────────────────────────────────────
//  Helper: build the AI prompt
// ────────────────────────────────────────────────
function buildPrompt(MCP, vector) {
  let prompt = `
${MCP.context.system_role}

${MCP.context.instructions.join("\n")}

Use this genre key mapping:
${JSON.stringify(MCP.context.genre_key, null, 2)}

Taste vector:
${JSON.stringify(vector, null, 2)}
`;

  // 🧠 Inject "Avoid these songs" clause if we have history
  if (recentSongs.length > 0) {
    prompt += `\nDo not pick from these songs: ${recentSongs.join(", ")}.\n`;
  }

  prompt += `
Return ONLY a JSON array with ONE item like ["Song - Artist"].
Start with '[' and end with ']'. No markdown or explanation.
  `;

  return prompt;
}

// ────────────────────────────────────────────────
//  Main: call OpenRouter from browser
// ────────────────────────────────────────────────
export async function recommendSong(vector = tasteVector, retryCount = 0) {
  try {
    const mcpResponse = await fetch("./backend/songify_mcp_v1.json");
    const MCP = await mcpResponse.json();
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
        model: "meta-llama/llama-3.3-70b-instruct:free",
        temperature: 1.0, // slightly more creative
        top_p: 0.95,
        max_tokens: 100,
        messages: [
          { role: "system", content: MCP.context.system_role },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    // Parse AI output safely
    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) text = match[0];
    const parsed = JSON.parse(text);

    songs = parsed;
    const song = songs[0];
    if (debug) console.log("🎧 Recommended song:", song);

    // --- Prevent duplicates ---
    if (recentSongs.includes(song) && retryCount < 3) {
      console.warn(`⚠️ "${song}" already in recent history → rerolling (attempt ${retryCount + 1})`);
      return await recommendSong(vector, retryCount + 1);
    }

    // --- Update history ---
    recentSongs.push(song);
    if (recentSongs.length > RECENT_HISTORY_LIMIT) {
      recentSongs.shift(); // keep last 10
    }

    if (debug) console.log("🕒 Recent songs memory:", recentSongs);
    return song;

  } catch (err) {
    console.error("⚠️ Error fetching songs from OpenRouter:", err);
    const fallback = songs[Math.floor(Math.random() * songs.length)];
    if (debug) console.log("🎵 Returning fallback song:", fallback);
    return fallback;
  }
}


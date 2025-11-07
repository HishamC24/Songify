/**
 * Songify backend – local + GitHub Pages version (OpenRouter.ai)
 * Works directly in browser, CORS-safe, no backend needed.
 */

// 🔹 Replace with your OpenRouter key (safe for local dev)
const OPENROUTER_API_KEY = "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";

// Example fallback song
export let songs = [
  "Can't Hold Us - Macklemore",
  "GTA 2 - Rarin",
  "Assumptions - Sam Gellaitry",
  "Levitating Dua Lipa",
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
function buildPrompt(MCP) {
  return `
${MCP.context.system_role}

${MCP.context.instructions.join("\n")}

Use this genre key mapping:
${JSON.stringify(MCP.context.genre_key, null, 2)}

Your entire reply must be a valid JSON array (1 items) of a "Song - Artist" string.
Start with '[' and end with ']'.

Taste vector:
${JSON.stringify(tasteVector, null, 2)}
`;
}

// ────────────────────────────────────────────────
//  Main: call OpenRouter from browser
// ────────────────────────────────────────────────
export async function recommendSong() {
  try {
    const mcpResponse = await fetch("./backend/songify_mcp_v1.json");
    const MCP = await mcpResponse.json();
    const prompt = buildPrompt(MCP);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // These help OpenRouter verify browser usage
        "HTTP-Referer": "http://127.0.0.1:5500/",
        "X-Title": "Songify"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0,
        max_tokens: 512
      })
    });

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";

    // Extract JSON array safely
    const match = text.match(/\[[\s\S]*\]/);
    if (match) text = match[0];

    const parsed = JSON.parse(text);
    songs = parsed;
    console.log("🎧 Recommended song:", songs);
    return songs;
  } catch (err) {
    console.error("⚠️ Error fetching songs from OpenRouter:", err);
    console.log("Returning fallback song.");
    return songs;
  }
}

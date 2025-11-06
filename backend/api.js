/**
 * Songify backend – local + GitHub Pages version (OpenRouter.ai)
 * Works directly in browser, CORS-safe, no backend needed.
 */

// 🔹 Replace with your OpenRouter key (safe for local dev)
const OPENROUTER_API_KEY = "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";

// Example fallback songs
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
  genreIdentity: [0.8, 0.3, 0.4, 0.7, 0.5, 0.2, 0.9, 0.1, 0.6, 0.8, 0.3],
  artistVariety: 0.7,
  eraPreference: 0.6,
  explicitTolerance: 0.5,
  popularityBias: 0.3,
  energyPreference: 0.9
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

Your entire reply must be a valid JSON array (3–7 items) of "Song - Artist" strings.
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

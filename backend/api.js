/**
 * Songify backend – stable version using Llama 3 70B Instruct
 * Requires:  npm install openai
 */

import fs from "fs";
import OpenAI from "openai";

// 🔹 Replace with your actual NVIDIA key
const NVIDIA_API_KEY = "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";

// ────────────────────────────────────────────────
//  1.  Setup client
// ────────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

// ────────────────────────────────────────────────
//  2.  Load your MCP definition
// ────────────────────────────────────────────────
const MCP = JSON.parse(fs.readFileSync("./songify_mcp_v1.json", "utf8"));

// Example taste vector (for testing)
const tasteVector = {
  genreIdentity: [0.8, 0.3, 0.4, 0.7, 0.5, 0.2, 0.9, 0.1, 0.6, 0.8, 0.3],
  artistVariety: 0.7,
  eraPreference: 0.6,
  explicitTolerance: 0.5,
  popularityBias: 0.3,
  energyPreference: 0.9
};

// ────────────────────────────────────────────────
//  3.  Prompt builder
// ────────────────────────────────────────────────
function buildPrompt() {
  return `
${MCP.context.system_role}

${MCP.context.instructions.join("\n")}

Use this genre key mapping:
${JSON.stringify(MCP.context.genre_key, null, 2)}

Your entire reply must be a valid JSON array (3–7 items) of "Song - Artist" strings.
Start with '[' and end with ']'. 
No explanations, markdown, or extra text.

Taste vector:
${JSON.stringify(tasteVector, null, 2)}
`;
}

// ────────────────────────────────────────────────
//  4.  Call NVIDIA + parse response
// ────────────────────────────────────────────────
async function main() {
  console.log("🧠  Requesting recommendations from Llama 3 70B Instruct...\n");

  const completion = await openai.chat.completions.create({
    model: "meta/llama3-70b-instruct",
    messages: [{ role: "user", content: buildPrompt() }],
    temperature: 0.7,
    max_tokens: 512
  });

  let text = completion.choices?.[0]?.message?.content?.trim() || "";

  // Extract only the JSON array portion
  const match = text.match(/\[[\s\S]*\]/);
  if (match) text = match[0];

  try {
    const songs = JSON.parse(text);
    console.log("🎧  Recommended songs:\n", songs);
  } catch {
    console.log("⚠️  Model returned non-JSON output:\n", text);
  }
}

main().catch(console.error);


import { debug } from "../globalSettings.js";

// =========================
// === SONGIFY VECTOR LOGIC ===
// =========================
const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);



// ===== Persistent Taste Profile (localStorage integration) =====
const savedProfile = localStorage.getItem("songify_tasteProfile");

let tasteProfile = {
  genreIdentity: Array(11).fill(0.500),
  artistVariety: 0.500,
  eraPreference: 0.500,
  explicitnessTolerance: 0.500,
  popularityBias: 0.500,
  energyPreference: 0.500,
};

if (debug) console.log("🎵 Created new default taste profile.", tasteProfile);
// LOAD SAVED PROFILE

// if (savedProfile) {
//   // Load from localStorage if it exists
//  // tasteProfile = JSON.parse(savedProfile); (commented out for debugging)
//   console.log("🎵 Loaded saved taste profile:", tasteProfile);
// } else {
//   // Otherwise start fresh (neutral vector)
//   tasteProfile = {
//     genreIdentity: Array(11).fill(0.500),
//     artistVariety: 0.500,
//     eraPreference: 0.500,
//     explicitnessTolerance: 0.500,
//     popularityBias: 0.500,
//     energyPreference: 0.500,
//   };
//   console.log("🎵 Created new default taste profile.");
// }



// ========================
// === Helper Functions ===
// ========================

function estimatePopularity(song) {
  const base = 1 - Math.min(song.trackNumber / 20, 1);
  return clamp(base + (song.artistName.length % 10) * 0.01, 0, 1);
}

function computeEnergy(song) {
  const title = (song.trackName + " " + song.artistName).toLowerCase();
  const keywords = ["remix", "live", "club", "dance", "anthem", "bass"];
  let score = keywords.some(k => title.includes(k)) ? 0.15 : 0;
  const g = song.genre;
  if (g.includes("electronic") || g.includes("rock") || g.includes("hip-hop")) score += 0.7;
  else if (g.includes("jazz") || g.includes("classical")) score += 0.2;
  else score += 0.4;
  if (song.explicit) score += 0.05;
  return clamp(score, 0, 1);
}


// ==========================
// ====== Weight Table ======
// ==========================

// Logarithmic-like easing: growth slows as value approaches 1
function logGrow(current, delta, rate = 1.0) {
  const next = current + delta * rate * (1 - Math.log1p(current));
  return clamp(next, 0.0001, 0.9999);
}


const signalWeights = {
  like: { genre: +0.015, energy: +0.010, popularity: +0.008, explicit: +0.006, era: +0.004, variety: -0.002 },
  dislike: { genre: -0.012, energy: -0.010, popularity: -0.008, explicit: -0.006, era: -0.004, variety: +0.002 },
  listen: { genre: +0.004, energy: +0.012, popularity: +0.004, explicit: 0.000, era: +0.006, variety: +0.002 },
  replay: { genre: +0.006, energy: +0.004, popularity: +0.002, explicit: 0.000, era: +0.010, variety: -0.004 },
  share: { genre: +0.006, energy: +0.006, popularity: +0.012, explicit: +0.004, era: +0.006, variety: +0.008 },
  favorite: { genre: +0.010, energy: +0.008, popularity: +0.006, explicit: +0.012, era: +0.006, variety: -0.004 }
};



// ============================
// ==== Main Vector Update ====
// ============================


export function updateTasteProfile(song, feedback = {}) {
  // --- guard ---
  if (!song || typeof song !== "object") {
    console.warn("⚠️ No valid song object for updateTasteProfile");
    return;
  }

  if (debug) console.log("🎧 Using currentSongData for:", song.trackName, "-", song.artistName);

  const lr = 0.02; // learning rate

  // turn the feedback flags into a simple list of active signals
  const activeSignals = Object.entries(feedback).filter(([_, v]) => v);
  if (activeSignals.length === 0) return;

  // use safe field names that exist on the song objects you save
  const energy = computeEnergy({
    trackName: song.trackName,
    artistName: song.artistName,
    genre: song.primaryGenreName?.toLowerCase() || "",
    explicit: song.explicit ?? false,
  });

  const popularity = estimatePopularity(song);
  const explicit = song.explicit ? 1 : 0;
  const currentYear = new Date().getFullYear();
  const recentness = 1 - Math.min((currentYear - (song.releaseYear || currentYear)) / 40, 1);

  const genres = [
    "pop", "hip-hop", "r&b", "rock", "indie",
    "country", "electronic", "jazz", "alternative", "dance", "classical"
  ];

  const gIndex = genres.findIndex(g =>
    (song.primaryGenreName || "").toLowerCase().includes(g)
  );

  for (const [sigName, sigValue] of activeSignals) {
    const w = signalWeights[sigName];
    if (!w) continue;
    const mult = typeof sigValue === "number" ? sigValue / 100 : 1;

    // --- update 11-dimensional genre vector ---
    for (let i = 0; i < genres.length; i++) {
      const influence = (i === gIndex ? 1.0 : 0.15);
      const delta = lr * w.genre * mult * influence;
      tasteProfile.genreIdentity[i] = logGrow(tasteProfile.genreIdentity[i], delta);
    }

    // --- update scalar components ---
    // --- Update scalar components safely ---
    tasteProfile.energyPreference = logGrow(tasteProfile.energyPreference, lr * w.energy * mult * (energy - 0.5));
    tasteProfile.popularityBias = logGrow(tasteProfile.popularityBias, lr * w.popularity * mult * (popularity - 0.5));
    tasteProfile.explicitnessTolerance = logGrow(tasteProfile.explicitnessTolerance, lr * w.explicit * mult * (explicit - 0.5));
    tasteProfile.eraPreference = logGrow(tasteProfile.eraPreference, lr * w.era * mult * (recentness - 0.5));
    tasteProfile.artistVariety = logGrow(tasteProfile.artistVariety, lr * w.variety * mult);

  }

  saveTasteProfile();
  logVector();

  const rounded = JSON.parse(JSON.stringify(tasteProfile, (k, v) =>
    typeof v === "number" ? Number(v.toFixed(4)) : v
  ));

  if (debug) console.log("🧭 Taste profile updated:", rounded);
  return tasteProfile;
}


// ============================
// ===== Helpers & Export =====
// ============================

function saveTasteProfile() {
  localStorage.setItem("songify_tasteProfile", JSON.stringify(tasteProfile));
  if (debug) console.log("💾 Taste profile saved to localStorage.");
}

function logVector() {
  const genres = [
    "pop", "hip-hop", "r&b", "rock", "indie",
    "country", "electronic", "jazz", "alternative", "dance", "classical"
  ];
  const summary = genres.map((g, i) => `${g}:${tasteProfile.genreIdentity[i].toFixed(2)}`).join(" | ");
  if (debug) console.log("🎚️ Genres:", summary);
}



// ---------- Export / Import ----------
function exportTasteProfileJSON() {
  const blob = new Blob([JSON.stringify(tasteProfile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasteProfile.json";
  a.click();
  URL.revokeObjectURL(url);
}

// QR export (requires QRCode library)
export function exportTasteProfileQR(canvasId = "qrCanvas") {
  const {
    genreIdentity,
    artistVariety,
    eraPreference,
    explicitnessTolerance,
    popularityBias,
    energyPreference
  } = tasteProfile;

  // join genre floats with commas, then append other components separated by "|"
  const vectorString = [
    genreIdentity.map(v => v.toFixed(3)).join(","),
    artistVariety.toFixed(3),
    eraPreference.toFixed(3),
    explicitnessTolerance.toFixed(3),
    popularityBias.toFixed(3),
    energyPreference.toFixed(3)
  ].join("|");

  const canvas = document.getElementById(canvasId);
  QRCode.toCanvas(canvas, vectorString, { width: 250 }, err => {
    if (err) console.error(err);
    else {
      if (debug) console.log("✅ compact vector QR generated");
      canvas.style.display = "block";
    }
  });
}

// decode qr representation
function importVectorFromString(str) {
  const parts = str.split("|");
  const genreVals = parts[0].split(",").map(Number);
  tasteProfile = {
    genreIdentity: genreVals,
    artistVariety: parseFloat(parts[1]),
    eraPreference: parseFloat(parts[2]),
    explicitnessTolerance: parseFloat(parts[3]),
    popularityBias: parseFloat(parts[4]),
    energyPreference: parseFloat(parts[5])
  };
}


// Example manual test in console
window.songifyVectorTest = async () => {
  await updateTasteProfile("Levitating Dua Lipa", {
    like: true,
    dislike: false,
    share: true,
    replay: 2,
    listenPercent: 90,
    favorite: false,
  });
  exportTasteProfileQR();
};


// expose functions to global window scope so buttons can call them
window.songifyVectorTest = songifyVectorTest;
window.exportTasteProfileJSON = exportTasteProfileJSON;
window.exportTasteProfileQR = exportTasteProfileQR;



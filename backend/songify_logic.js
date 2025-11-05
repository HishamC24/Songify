// =========================
// === SONGIFY VECTOR LOGIC ===
// =========================
const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);



// ===== Persistent Taste Profile (localStorage integration) =====
const savedProfile = localStorage.getItem("songify_tasteProfile");

let tasteProfile;

if (savedProfile) {
  // Load from localStorage if it exists
  tasteProfile = JSON.parse(savedProfile);
  console.log("🎵 Loaded saved taste profile:", tasteProfile);
} else {
  // Otherwise start fresh (neutral vector)
  tasteProfile = {
    genreIdentity: Array(11).fill(0.5),
    artistVariety: 0.5,
    eraPreference: 0.5,
    explicitnessTolerance: 0.5,
    popularityBias: 0.5,
    energyPreference: 0.5,
  };
  console.log("🎵 Created new default taste profile.");
}

async function fetchSongData(songName) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(songName)}&media=music&entity=song&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results.length) throw new Error("No song found");
  const s = data.results[0];
  return {
    trackName: s.trackName,
    artistName: s.artistName,
    genre: (s.primaryGenreName || "").toLowerCase(),
    explicit: s.trackExplicitness === "explicit",
    releaseYear: new Date(s.releaseDate).getFullYear(),
    trackNumber: s.trackNumber || 1
  };
}

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

async function updateTasteProfile(songName, signals) {
  const song = await fetchSongData(songName);
  const energyScore = computeEnergy(song);
  const popularityScore = estimatePopularity(song);
  const currentYear = new Date().getFullYear();
  const age = clamp((currentYear - song.releaseYear) / 40, 0, 1);
  const isRecent = 1 - age;
  const { like, dislike, share, replay, listenPercent, favorite } = signals;
  const lr = 0.1;
  const adjust = (v, d) => clamp(v + lr * d, 0, 1);

  if (like) {
    tasteProfile.energyPreference = adjust(tasteProfile.energyPreference, energyScore - 0.5);
    tasteProfile.popularityBias = adjust(tasteProfile.popularityBias, popularityScore - 0.5);
    tasteProfile.explicitnessTolerance = adjust(tasteProfile.explicitnessTolerance, song.explicit ? 0.1 : -0.05);
  }
  if (dislike) {
    tasteProfile.energyPreference = adjust(tasteProfile.energyPreference, -(energyScore - 0.5));
    tasteProfile.popularityBias = adjust(tasteProfile.popularityBias, -(popularityScore - 0.5));
  }
  if (replay && replay > 0) {
    tasteProfile.eraPreference = adjust(tasteProfile.eraPreference, isRecent - 0.5);
    tasteProfile.artistVariety = adjust(tasteProfile.artistVariety, -0.05);
  }
  if (share) {
    tasteProfile.artistVariety = adjust(tasteProfile.artistVariety, 0.05);
    tasteProfile.popularityBias = adjust(tasteProfile.popularityBias, 0.05);
  }
  if (listenPercent && listenPercent > 0) {
    const weight = listenPercent / 100 - 0.5;
    tasteProfile.energyPreference = adjust(tasteProfile.energyPreference, weight);
  }
  if (favorite) {
    tasteProfile.explicitnessTolerance = adjust(tasteProfile.explicitnessTolerance, song.explicit ? 0.1 : -0.05);
    tasteProfile.popularityBias = adjust(tasteProfile.popularityBias, 0.05);
  }

  const genres = ["pop","electronic","country","rock","rap","classical","jazz","metal","hip-hop","r&b","latin"];
  const idx = genres.findIndex(g => song.genre.includes(g));
  if (idx >= 0)
    tasteProfile.genreIdentity[idx] = clamp(
      tasteProfile.genreIdentity[idx] + lr * (like ? 0.1 : dislike ? -0.1 : 0),
      0, 1
    );

  console.log("Updated taste profile:", tasteProfile);
  saveTasteProfile();
  return tasteProfile;
}

// Save profile to localStorage after each update
function saveTasteProfile() {
  localStorage.setItem("songify_tasteProfile", JSON.stringify(tasteProfile));
  console.log("💾 Taste profile saved to localStorage.");
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
      console.log("✅ compact vector QR generated");
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


//EXAMPLE FUNCTION

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

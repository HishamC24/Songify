// ==============================
// ===== SONGIFY BACKEND ========
// ==============================

import { debug } from "./globalSettings.js";
import { updateTasteProfile } from "./backend/songify_logic.js";  // ✅ ADDED

// ===== INITIAL SONG POOL =====
let songs = [
  "Can't Hold Us Macklemore",
  "GTA 2 Rarin",
  "Assumptions Sam Gellaitry",
  "Levitating Dua Lipa",
  "Loyal Odesza",
  "How Long Charlie Puth",
  "Hyperspace Sam I"
];

// ===== LOCAL STORAGE STATE =====

//const dislikedSongs = JSON.parse(localStorage.getItem("dislikedSongs") || "[]");
//const likedSongs = JSON.parse(localStorage.getItem("likedSongs") || "[]");
const dislikedSongs = [];
const likedSongs = [];


// Remove previously *disliked* songs only
songs = songs.filter(song => !dislikedSongs.includes(song));
if (debug) console.log("🎶 Loaded songs:", songs);
if (debug) console.log("👍 liked:", likedSongs, "👎 disliked:", dislikedSongs);


// ==========================
// ===== SONG REQUESTING ====
// ==========================

export function requestSong() {
  if (songs.length === 0) {
    console.error("No songs left bby, playing Rick Astley instead 🎤");
    return "Never Gonna Give You Up Rick Astley";
  }
  return songs[Math.floor(Math.random() * songs.length)];
}


// =============================
// ===== LIKE / DISLIKE ========
// =============================

export async function dislikeSong(song) {
  if (!song) return console.warn("⚠️ dislikeSong() called with no song object");
  const songName = song.trackName || song;

  // store name string for filtering
  if (!dislikedSongs.includes(songName)) {
    dislikedSongs.push(songName);
    //   localStorage.setItem("dislikedSongs", JSON.stringify(dislikedSongs));
  }

  // remove from rotation
  songs = songs.filter(s => s !== songName);
  console.log(`👎 Disliked: ${songName}`);

  // update taste vector if full object provided
  if (typeof song === "object") {
    const updated = await updateTasteProfile(song, { dislike: true });
    if (updated) {
      console.log("🧭 Updated taste vector:", updated);
      console.log("🎚️ Genres:", updated.genreIdentity.map(v => v.toFixed(2)).join(" | "));
    }
  }
}

export async function likeSong(song) {
  console.log(song);
  if (!song) return console.warn("⚠️ likeSong() called with no song object");
  const songName = song.trackName || song;

  // keep liked songs in rotation — do NOT remove from songs[]
  if (!likedSongs.includes(songName)) {
    likedSongs.push(songName);
    //   localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }

  console.log(`👍 Liked: ${songName}`);
  console.log(typeof song);

  // update taste vector if object provided
  if (typeof song === "object") {
    console.log(`test1`);
    const updated = await updateTasteProfile(song, { like: true });
    console.log(`test2`);
    if (updated) {
      console.log(`test3`);
      console.log("🧭 Updated taste vector:", updated);
      console.log("🎚️ Genres:", updated.genreIdentity.map(v => v.toFixed(2)).join(" | "));
    }
  }
}


// ========================
// ===== EXPORTS ==========
// ========================

export { songs };

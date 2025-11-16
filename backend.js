/*

NEW STUFF

*/
// ==============================
// ===== SONGIFY BACKEND ========
// ==============================

import { debug } from "./globalSettings.js";
import { updateTasteProfile } from "./backend/songify_logic.js";
import { recommendSong, songs } from "./backend/api.js";

// ===== INITIAL SONG POOL =====
// let songs = [
//   "Can't Hold Us Macklemore",
//   "GTA 2 Rarin",
//   "Assumptions Sam Gellaitry",
//   "Levitating Dua Lipa",
//   "Loyal Odesza",
//   "How Long Charlie Puth",
//   "Hyperspace Sam I"
// ];

// ===== LOCAL STORAGE STATE =====

//const dislikedSongs = JSON.parse(localStorage.getItem("dislikedSongs") || "[]");
//const likedSongs = JSON.parse(localStorage.getItem("likedSongs") || "[]");
const dislikedSongs = [];
const likedSongs = [];


// Remove previously *disliked* songs only
// songs = songs.filter(song => !dislikedSongs.includes(song));
for (let i = songs.length - 1; i >= 0; i--) {
  if (dislikedSongs.includes(songs[i])) songs.splice(i, 1);
}
if (debug) console.log("🎶 Loaded songs:", songs);
if (debug) console.log("👍 liked:", likedSongs, "👎 disliked:", dislikedSongs);


// ==========================
// ===== SONG REQUESTING ====
// ==========================

export function requestSong() {
  // 🛡️ Safety: if queue empty, reseed with ONE fallback
  if (!songs || songs.length === 0) {
    const fallback = "Levitating - Dua Lipa";
    songs = [fallback]; // ensure only 1, avoid duplicates
    if (debug) console.warn("⚠️ Song queue was empty — reseeded with:", fallback);
  }

  // 🎧 Take the next song
  const returnSong = songs.shift();

  if (debug) {
    console.log("🎵 requestSong() → returning:", returnSong);
    console.log("📦 Remaining queue:", songs);
  }

  // 🧠 Background refill if queue low
  if (songs.length <= 3) {
    if (debug) console.log("Queue low (<=3), requesting 5 new AI songs…");

    recommendSong()
      .then((newSongs) => {

        // newSongs MUST be an array of 5 strings
        if (Array.isArray(newSongs) && newSongs.every(s => typeof s === "string")) {
          songs.push(...newSongs);

          if (debug) {
            console.log("🎶 Queued new AI songs:", newSongs);
            console.log("📦 Queue after refill:", songs);
          }

        } else if (debug) {
          console.warn("⚠️ AI returned invalid song list:", newSongs);
        }
      })
      .catch((err) => console.error("⚠️ Failed to queue AI songs:", err));
  }

  // ✅ Always return a valid string
  return returnSong || "Levitating - Dua Lipa";
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
  // songs = songs.filter(s => s !== songName);
  if (debug) console.log(`👎 Disliked: ${songName}`);

  // update taste vector if full object provided
  if (typeof song === "object") {
    const updated = await updateTasteProfile(song, { dislike: true });
    if (updated) {
      if (debug) console.log("🧭 Updated taste vector:", updated);
    }
  }
}

export async function likeSong(song) {
  if (debug) console.log(song);
  if (!song) return console.warn("⚠️ likeSong() called with no song object");
  const songName = song.trackName || song;

  // keep liked songs in rotation — do NOT remove from songs[]
  if (!likedSongs.includes(songName)) {
    likedSongs.push(songName);
    //   localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }

  if (debug) console.log(`👍 Liked: ${songName}`);
  if (debug) console.log(typeof song);

  // update taste vector if object provided
  if (typeof song === "object") {
    const updated = await updateTasteProfile(song, { like: true });
    if (updated) {
      if (debug) console.log("🧭 Updated taste vector:", updated);
    }
  }
}


// ========================
// ===== EXPORTS ==========
// ========================

export { songs };

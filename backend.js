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
  // when theres 3 songs in the array, first have a song ready to return based off the top song of the stack
  const returnSong = songs[0];
  songs.shift();

  // then in the queue, request a new Personalized Reccomended song with the ai
  if (songs.length <= 3) {
    // console.error("No songs left bby, enqueuing Rick Astley instead 🎤");
    // return "Never Gonna Give You Up Rick Astley";
    // songs.push("Never Gonna Give You Up Rick Astley");
    // instead of pushing never gonna give you up, push the new AI requested song
    songs.push(recommendSong());
  }

  // after that, return fthe saved song from step 1
  return returnSong;
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
      if (debug) console.log("🎚️ Genres:", updated.genreIdentity.map(v => v.toFixed(2)).join(" | "));
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
      if (debug) console.log("🎚️ Genres:", updated.genreIdentity.map(v => v.toFixed(2)).join(" | "));
    }
  }
}


// ========================
// ===== EXPORTS ==========
// ========================

export { songs };

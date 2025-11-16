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


/* some dont show up because itunes doesnt return a result,
in theory we would be able to tell if theres no result when
swiping so it doesnt even show up in this list in the first
place at all - HC */

let playlistList = [
  {
    "name": "All", "emoji": "🎵", "songList": [
      { "name": "Can't Hold Us - Macklemore", "rank": 1, "favorited": true },
      { "name": "GTA 2 - Rarin", "rank": 2, "favorited": false },
      { "name": "Assumptions - Sam Gellaitry", "rank": 3, "favorited": true },
      { "name": "Levitating - Dua Lipa", "rank": 4, "favorited": true },
      { "name": "Loyal - ODESZA", "rank": 5, "favorited": true },
      { "name": "How Long - Charlie Puth", "rank": 6, "favorited": false },
      { "name": "Not Like Us - Kendrick Lamar", "rank": 7, "favorited": false },
      { "name": "Adventure of a Lifetime - Coldplay", "rank": 8, "favorited": false },
      { "name": "Treasure - Bruno Mars", "rank": 9, "favorited": false },
      { "name": "September - Earth, Wind & Fire", "rank": 10, "favorited": false },
      { "name": "Higher Love - Kygo & Whitney Houston", "rank": 11, "favorited": false },
      { "name": "Walking on a Dream - Empire of the Sun", "rank": 12, "favorited": false },
      { "name": "Classic - MKTO", "rank": 13, "favorited": false },
      { "name": "Good Day for Living - Rascal Flatts", "rank": 14, "favorited": false },
      { "name": "Cake By The Ocean - DNCE", "rank": 15, "favorited": true },
      { "name": "Come and Get Your Love - Redbone", "rank": 16, "favorited": false },
      { "name": "Take On Me - a-ha", "rank": 17, "favorited": false },
      { "name": "Can't Stop The Feeling! - Justin Timberlake", "rank": 18, "favorited": false },
      { "name": "Shut Up and Dance - WALK THE MOON", "rank": 19, "favorited": false }
    ]
  },
  {
    "name": "Favorites", "emoji": "⭐", "songList": [
      { "name": "Can't Hold Us - Macklemore", "rank": 1, "favorited": true }
    ]
  },
  {
    "name": "Video Games", "emoji": "🎮", "songList": [
      { "name": "Title Theme - Koji Kondo (The Legend of Zelda: Ocarina of Time)", "rank": 1, "favorited": true },
      { "name": "Still Alive - GLaDOS (Portal)", "rank": 2, "favorited": true },
      { "name": "Zelda's Lullaby - Koji Kondo (The Legend of Zelda: Ocarina of Time)", "rank": 3, "favorited": false },
      { "name": "One Winged Angel - Nobuo Uematsu (Final Fantasy VII)", "rank": 4, "favorited": false },
      { "name": "Gerudo Valley - Koji Kondo (The Legend of Zelda: Ocarina of Time)", "rank": 5, "favorited": false },
      { "name": "Megalovania - Toby Fox (Undertale)", "rank": 6, "favorited": true },
      { "name": "Bombing Mission - Nobuo Uematsu (Final Fantasy VII)", "rank": 7, "favorited": false },
      { "name": "Staff Roll - Koji Kondo (Super Mario 64)", "rank": 8, "favorited": false },
      { "name": "Guile's Theme - Yoko Shimomura (Street Fighter II)", "rank": 9, "favorited": false },
      { "name": "Main Theme - Koji Kondo (Super Mario Bros.)", "rank": 10, "favorited": true },
      { "name": "Aquatic Ambiance - David Wise (Donkey Kong Country)", "rank": 11, "favorited": false }
    ]
  },
  {
    "name": "Classical", "emoji": "🎻", "songList": [
      { "name": "Symphony No. 5 in C minor - Ludwig van Beethoven", "rank": 1, "favorited": true },
      { "name": "Clair de Lune - Claude Debussy", "rank": 2, "favorited": false },
      { "name": "The Four Seasons: Spring - Antonio Vivaldi", "rank": 3, "favorited": false },
      { "name": "Canon in D - Johann Pachelbel", "rank": 4, "favorited": false },
      { "name": "Swan Lake Suite - Pyotr Ilyich Tchaikovsky", "rank": 5, "favorited": true },
      { "name": "Nocturne Op.9 No.2 - Frédéric Chopin", "rank": 6, "favorited": false },
      { "name": "Eine kleine Nachtmusik - Wolfgang Amadeus Mozart", "rank": 7, "favorited": true },
      { "name": "Gymnopédie No.1 - Erik Satie", "rank": 8, "favorited": false },
      { "name": "Boléro - Maurice Ravel", "rank": 9, "favorited": false },
      { "name": "Moonlight Sonata - Ludwig van Beethoven", "rank": 10, "favorited": true }
    ]
  },
  {
    "name": "Jazz", "emoji": "🎷", "songList": [
      { "name": "So What - Miles Davis", "rank": 1, "favorited": true },
      { "name": "Take Five - Dave Brubeck Quartet", "rank": 2, "favorited": false },
      { "name": "My Favorite Things - John Coltrane", "rank": 3, "favorited": false },
      { "name": "Freddie Freeloader - Miles Davis", "rank": 4, "favorited": true },
      { "name": "Feeling Good - Nina Simone", "rank": 5, "favorited": false },
      { "name": "All Blues - Miles Davis", "rank": 6, "favorited": false },
      { "name": "Blue in Green - Bill Evans", "rank": 7, "favorited": false },
      { "name": "Round Midnight - Thelonious Monk", "rank": 8, "favorited": true },
      { "name": "What a Wonderful World - Louis Armstrong", "rank": 9, "favorited": true },
      { "name": "Cantaloupe Island - Herbie Hancock", "rank": 10, "favorited": false }
    ]
  }
]

export function requestSongList(playlistName = "All") {
  return playlistList.filter(playlist => playlist.name == playlistName);
}

export function requestPlaylistList() {
  return playlistList;
}

// ========================
// ===== EXPORTS ==========
// ========================

export { songs };

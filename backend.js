import { debug } from "./globalSettings.js";

let songs = [
  "Can't Hold Us Macklemore",
  "GTA 2 Rarin",
  "Assumptions Sam Gellaitry",
  "Levitating Dua Lipa",
  "Loyal Odesza",
  "How Long Charlie Puth",
  "Hyperspace Sam I"
];
// Load disliked songs from localStorage
const dislikedSongs = JSON.parse(localStorage.getItem("dislikedSongs") || "[]");
// Load liked songs from localStorage
const likedSongs = JSON.parse(localStorage.getItem("likedSongs") || "[]");

// Filter out disliked and liked ones
songs = songs.filter(song => !dislikedSongs.includes(song));
// songs = songs.filter(song => !dislikedSongs.includes(song) && !likedSongs.includes(song));
if (debug) console.log(localStorage);

function requestSong() {
  if (songs.length === 0) {
    console.error("No songs left bby, playing Rick Astley instead");
    return "Never gonna give you up Rick Astley";
  };
  return songs[Math.floor(Math.random() * songs.length)];
}

function dislikeSong(songName) {
  // Avoid duplicates
  if (!dislikedSongs.includes(songName)) {
    dislikedSongs.push(songName);
    localStorage.setItem("dislikedSongs", JSON.stringify(dislikedSongs));
  }

  // Remove from list
  songs = songs.filter(song => song !== songName);
  if (debug) console.log(`Disliked: ${songName}`);
}

function likeSong(songName) {
  // Avoid duplicates
  if (!likedSongs.includes(songName)) {
    likedSongs.push(songName);
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }

  // Optionally remove from list if you do not want to show liked songs again:
  songs = songs.filter(song => song !== songName);
  if (debug) console.log(`Liked: ${songName}`);
}

export { songs, requestSong, dislikeSong, likeSong };




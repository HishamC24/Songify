
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

// Filter out disliked ones
songs = songs.filter(song => !dislikedSongs.includes(song));

function requestSong() {
  if (songs.length === 0) return "No songs left bby";
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
  console.log(`Disliked: ${songName}`);
}

export { songs, requestSong, dislikeSong };




function requestSong() {
  const songs = [
    "Can't Hold Us Macklemore",
    "GTA 2 Rarin",
    "Assumptions Sam Gellaitry",
    "Levitating Dua Lipa",
    "Loyal Odesza",
    "How Long Charlie Puth",
    "Hyperspace Sam I"
  ];
  return songs[Math.floor(Math.random() * songs.length)];
}


let likedSongs = JSON.parse(localStorage.getItem("likedSongs")) || [];

function likeSong(songName) {
  const index = likedSongs.indexOf(songName);
  if (index !== -1) {
    likedSongs.splice(index, 1);
  } else {
    likedSongs.push(songName);
  }
  localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  return likedSongs;
}

export { requestSong, likeSong };


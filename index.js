// ==============================
// ===== IMPORTS & GLOBALS ======
// ==============================
import { updateTasteProfile } from "./backend/songify_logic.js";
import { songs, requestSong, dislikeSong, likeSong, requestSongList, requestPlaylistList } from "./backend.js";
import { debug } from "./globalSettings.js";

// ==============================
// ======= CONSTANTS ============
// ==============================
const installBtn = document.getElementById("install-btn");
const cardViewMenuButton = document.getElementById('cardViewMenuButton');
const menuToggleElements = document.querySelectorAll('.menuToggle');

const nextCardHTML = `
  <div class="card" id="nextCard" style="opacity: 0;">
    <img />
    <div class="explicitcy">
      <p class="title">Loading...</p>
    </div>
    <p class="artist">Loading...</p>
    <div class="seekbarContainer">
      <input type="range" class="seekbar" min="0" max="30" value="0" step="0.1" />
      <div class="seekbarLabels">
        <span class="currentTimeLabel">00:00</span>
        <span class="durationLabel">00:30</span>
      </div>
    </div>
    <div class="playerContainer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="play active">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="pause">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
        <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
      </svg>
    </div>
    <p class="details">Loading...<br />Loading...</p>
    <div class="volumeContainer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M15 8a5 5 0 0 1 0 8" />
        <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
      </svg>
      <input type="range" class="volume" min="0" max="100" value="50" step="0.1" />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M15 8a5 5 0 0 1 0 8" />
        <path d="M17.7 5a9 9 0 0 1 0 14" />
        <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
      </svg>
    </div>
  </div>
`;

const dislikeIcon = `
<div class="dislikePopup iconPopup">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
            d="M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z"
        />
        <path
            d="M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z"
        />
    </svg>
</div>
`;

const likeIcon = `
<div class="likePopup iconPopup">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
            d="M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z"
        />
        <path
            d="M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z"
        />
    </svg>
</div>
`;

const starIcon = `
<div class="starPopup iconPopup">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"/>
    </svg>
</div>
`;

// ==============================
// ========== STATE =============
// ==============================
let isCardAnimating = false;
let cardIsLoading = false;
let mainAudio = null;
let listenStartTime = null;
let lastImportPercent = 0;
let mainPreviewUrl = null;
let mainCardPlaying = false;
let currentSong;
let nextSong;
let currentSongJson = {};
let selectedPlaylistIndex = 0;
let playlistDropdownExpanded = false;
let deferredPrompt = null;

// ==============================
// ===== UTILITY FUNCTIONS ======
// ==============================
const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ==============================
// ===== COPY TOAST FIX =========
// ==============================
function showCopyToast(message = "Link copied") {
    document.querySelectorAll(".copyToast").forEach(el => el.remove());
    const toast = document.createElement("div");
    toast.className = "copyToast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add("show"); });
    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 1600);
}

// ==============================
// ==== PWA INSTALL LOGIC  ======
// ==============================
function hideInstallButton() { installBtn.style.display = "none"; }
function showInstallButton() { installBtn.style.display = ""; }
function checkInstallState() {
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true ||
        document.referrer.includes("android-app://");
    if (isStandalone) hideInstallButton();
}
(function initPWA() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
    checkInstallState();
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        hideInstallButton();
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    });
    window.addEventListener("appinstalled", () => {
        hideInstallButton();
        deferredPrompt = null;
    });
})();

// ==============================
// ==== SONG FETCHING / LOADING =
// ==============================
async function fetchAndDisplaySong(songName, divID) {
    if (divID === "mainCard") cardIsLoading = true;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(songName)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (debug) console.log(data, songName);
        const results = (data.results || []).filter((item) => item.kind === "song");
        if (!results.length) return handleNoSong(divID);
        const song = results[0];
        currentSongJson = song;
        if (debug) console.log(song.trackName, "-", song.artistName);
        const card = document.getElementById(divID);
        if (!card) {
            if (debug) console.warn("No such div ID:", divID);
            return;
        }
        if (divID === "mainCard") window.currentSongObject = song;
        const img = card.querySelector("img");
        const titleElem = card.querySelector(".title");
        const artistElem = card.querySelector(".artist");
        const explicitElem = card.querySelector(".explicitcy");
        const detailsElem = card.querySelector(".details");
        if (img) {
            img.src = song.artworkUrl100.replace("100x100", "1500x1500");
            img.alt = `${song.trackName} by ${song.artistName}`;
        }
        if (titleElem) {
            titleElem.textContent = song.trackName;
            applyTitleMarqueeIfNeeded(titleElem);
        }
        if (artistElem) artistElem.textContent = song.artistName;
        if (explicitElem) {
            explicitElem.querySelectorAll(".explicit-marker").forEach((el) => el.remove());
            if (song.trackExplicitness === "explicit") {
                const marker = document.createElement("b");
                marker.className = "explicit-marker";
                marker.textContent = "E";
                explicitElem.prepend(marker);
            }
        }
        if (detailsElem) {
            detailsElem.innerHTML = `
              Genre: ${song.primaryGenreName || ""}<br>
              Release: ${formatDate(song.releaseDate)}
            `;
        }
        if (divID === "mainCard") setupMainAudio(song.previewUrl);
        if (divID === "mainCard") cardIsLoading = false;
    } catch (err) {
        console.error("Error fetching data:", err, songName);
    }
}
function handleNoSong(divID) {
    if (debug) console.warn("❌ No song results found – skipping...");
    if (divID === "mainCard") cardIsLoading = true;
    nextSong = requestSong();
    fetchAndDisplaySong(nextSong, divID);
}

// ==============================
// ===== AUDIO PLAYER ===========
// ==============================
let playBtn = document.querySelector("#mainCard .play");
let pauseBtn = document.querySelector("#mainCard .pause");
let seekbar = document.querySelector("#mainCard .seekbar");
let currentTimeLabel = document.querySelector("#mainCard .currentTimeLabel");
let durationLabel = document.querySelector("#mainCard .durationLabel");
let volumeSlider = document.querySelector("#mainCard .volume");

function refreshAudioPlayerElements() {
    playBtn = document.querySelector("#mainCard .play");
    pauseBtn = document.querySelector("#mainCard .pause");
    seekbar = document.querySelector("#mainCard .seekbar");
    currentTimeLabel = document.querySelector("#mainCard .currentTimeLabel");
    durationLabel = document.querySelector("#mainCard .durationLabel");
    volumeSlider = document.querySelector("#mainCard .volume");
}
if (pauseBtn) pauseBtn.style.display = "none";
function setupMainAudio(previewUrl) {
    if (mainAudio) mainAudio.pause();
    mainPreviewUrl = previewUrl || null;
    if (!mainPreviewUrl) {
        mainAudio = null;
        resetAudio();
        return;
    }
    mainAudio = new Audio(mainPreviewUrl);

    const localVolumeSlider = document.querySelector("#mainCard .volume");
    if (localVolumeSlider) {
        let initialValue = Number(localVolumeSlider.value);
        if (isNaN(initialValue)) initialValue = 50;
        mainAudio.volume = Math.max(0, Math.min(1, initialValue / 100));
    } else {
        mainAudio.volume = 0.5;
    }

    setupAudioProgressTracking(mainAudio);
    setupAudioEndedHandler(mainAudio);
    resetAudio();
}
function resetAudio() {
    if (mainAudio) mainAudio.pause();
    playBtn.style.display = "";
    pauseBtn.style.display = "none";
    if (seekbar) {
        seekbar.value = 0;
        seekbar.max = 30;
    }
    if (currentTimeLabel) currentTimeLabel.textContent = "00:00";
    if (durationLabel) durationLabel.textContent = "00:30";
    if (volumeSlider && typeof mainAudio?.volume === "number") {
        volumeSlider.value = Math.round((mainAudio.volume ?? 0.5) * 100);
    }
}
function setupAudioProgressTracking(audio) {
    audio.addEventListener("loadedmetadata", () => {
        if (seekbar && !isNaN(audio.duration)) {
            seekbar.max = audio.duration;
            durationLabel.textContent = formatTime(audio.duration);
        }
    });
    audio.addEventListener("timeupdate", () => {
        if (!isNaN(audio.currentTime)) {
            seekbar.value = audio.currentTime;
            currentTimeLabel.textContent = formatTime(audio.currentTime);
        }
    });
}
function setupAudioEndedHandler(audio) {
    audio.addEventListener("ended", () => {
        try {
            if (window.currentSongObject && listenStartTime) {
                const totalDuration = audio.duration || 30;
                const elapsed = (Date.now() - listenStartTime) / 1000;
                const listenPercent = Math.min((elapsed / totalDuration) * 100, 100);
                updateTasteProfile(window.currentSongObject, { listen: true, listenPercent });
                if (debug) console.log(`🎧 Logged listenPercent: ${listenPercent.toFixed(1)}%`);
            }
        } catch (err) {
            console.warn("⚠️ Listen% tracking error:", err);
        }
        listenStartTime = null;
        if (audio.currentTime !== 0) audio.currentTime = 0;
        if (!audio.paused) {
            audio.play();
        } else {
            if (mainCardPlaying && mainAudio === audio) {
                audio.play();
            }
        }
    });
}
function setupAudioPlayerListeners() {
    if (playBtn && !playBtn._listenerAttached) {
        playBtn.addEventListener("click", () => {
            if (!mainAudio || !mainPreviewUrl) return;
            mainAudio.play();
            listenStartTime = Date.now();
            playBtn.style.display = "none";
            pauseBtn.style.display = "inline";
            mainCardPlaying = true;
        });
        playBtn._listenerAttached = true;
    }
    if (pauseBtn && !pauseBtn._listenerAttached) {
        pauseBtn.addEventListener("click", () => {
            if (!mainAudio) return;
            mainAudio.pause();
            playBtn.style.display = "inline";
            pauseBtn.style.display = "none";
            mainCardPlaying = false;
        });
        pauseBtn._listenerAttached = true;
    }
    if (seekbar && !seekbar._listenerAttached) {
        seekbar.addEventListener("input", () => {
            if (!mainAudio) return;
            currentTimeLabel.textContent = formatTime(seekbar.value);
        });
        seekbar.addEventListener("change", () => {
            if (!mainAudio) return;
            mainAudio.currentTime = seekbar.value;
        });
        seekbar._listenerAttached = true;
    }
    if (volumeSlider && !volumeSlider._listenerAttached) {
        volumeSlider.addEventListener("input", () => {
            if (!mainAudio) return;
            const volumeValue = Math.max(0, Math.min(1, volumeSlider.value / 100));
            mainAudio.volume = volumeValue;
        });
        volumeSlider.addEventListener("change", () => {
            if (!mainAudio) return;
            const volumeValue = Math.max(0, Math.min(1, volumeSlider.value / 100));
            mainAudio.volume = volumeValue;
        });
        volumeSlider._listenerAttached = true;
    }
}
setupAudioPlayerListeners();

// ==============================
// ===== LISTEN/SONG HANDLING ===
// ==============================
function logListen() {
    if (!mainAudio || !window.currentSongObject) return;
    try {
        const elapsed = (Date.now() - (listenStartTime || Date.now())) / 1000;
        const total = mainAudio.duration || 30;
        const percent = Math.min((elapsed / total) * 100, 100);
        updateTasteProfile(window.currentSongObject, {
            listen: true,
            listenPercent: percent,
        });
        if (debug) console.log(`🎧 Logged listen%: ${percent.toFixed(1)}%`);
    } catch (err) {
        console.warn("⚠️ listen% tracking failed:", err);
    }
    listenStartTime = null;
}
async function handleSongSwitch(onSongAction) {
    if (typeof onSongAction === "function") onSongAction(currentSongJson);
    document.querySelectorAll(".iconPopup").forEach(popup => {
        popup.style.opacity = "0";
        popup.addEventListener("transitionend", function handler() {
            popup.removeEventListener("transitionend", handler);
            popup.remove();
        });
    });
    const cardsContainer = document.getElementById("cards");
    const mainCard = document.getElementById("mainCard");
    const nextCard = document.getElementById("nextCard");
    if (mainCard) {
        mainCard.remove();
        if (debug) console.log("Main card removed");
    }
    if (nextCard) {
        nextCard.id = "mainCard";
    }
    currentSong = nextSong;
    await fetchAndDisplaySong(currentSong, "mainCard");
    if (debug) console.log("Song fetched and displayed");
    const newMainCard = document.getElementById("mainCard");
    if (newMainCard) {
        newMainCard.insertAdjacentHTML("beforebegin", nextCardHTML);
    } else if (cardsContainer) {
        cardsContainer.insertAdjacentHTML("beforeend", nextCardHTML);
    }
    if (typeof window.applySquircles === "function") window.applySquircles();
    nextSong = requestSong();
    fetchAndDisplaySong(nextSong, "nextCard");
    refreshAudioPlayerElements();
    setupAudioPlayerListeners();
    attachIOSRangeHandlers();
    document.getElementById("nextCard").style.opacity = "";
    if (mainCardPlaying && mainAudio) {
        mainAudio.currentTime = 0;
        mainAudio.play();
        if (playBtn && pauseBtn) {
            playBtn.style.display = "none";
            pauseBtn.style.display = "inline";
        }
    }
}
window.handleSongSwitch = handleSongSwitch;

// ==============================
// ========= SWIPE HANDLERS =====
// ==============================
function showSwipePopup(type, percent = 1) {
    const existing = document.querySelector(".iconPopup");
    if (existing) existing.remove();
    let popupHTML;
    if (type === "like") popupHTML = likeIcon;
    else if (type === "dislike") popupHTML = dislikeIcon;
    else if (type === "star") popupHTML = starIcon;
    else return;
    document.body.insertAdjacentHTML("beforeend", popupHTML);
    const popup = document.querySelector(`.${type}Popup`);
    if (!popup) return;
    popup.style.opacity = percent;
    popup.style.transition = "opacity 0.25s ease-in-out";
    setTimeout(() => {
        popup.style.opacity = "0";
        popup.addEventListener("transitionend", () => popup.remove());
    }, 500);
}
async function animateSwipe(direction, callback) {
    const mainCard = document.getElementById("mainCard");
    if (!mainCard) {
        if (typeof callback === "function") callback();
        return;
    }
    let translateStr, angle = 0;
    if (direction === "right") {
        translateStr = `translateX(${window.innerWidth}px) rotate(12deg)`;
    } else if (direction === "left") {
        translateStr = `translateX(${-window.innerWidth}px) rotate(-12deg)`;
    } else if (direction === "up") {
        translateStr = `translateY(${-window.innerHeight * 1.1}px)`;
        angle = 0;
    }
    mainCard.style.transition = 'transform 0.25s ease-in-out';
    mainCard.style.transform = translateStr;
    function cleanupAndCallback() {
        mainCard.removeEventListener('transitionend', cleanupAndCallback);
        if (typeof callback === "function") callback();
    }
    mainCard.addEventListener('transitionend', cleanupAndCallback);
}
window.animateSwipe = animateSwipe;

document.getElementById("dislike-btn").addEventListener("click", () => {
    if (!window.currentSongObject) {
        console.warn("⚠️ No current song object yet!");
        return;
    }
    if (isCardAnimating || cardIsLoading) {
        console.warn("⏳ Card still loading, ignoring swipe.");
        return;
    }
    isCardAnimating = true;
    const songToDislike = { ...window.currentSongObject };
    showSwipePopup("dislike");
    animateSwipe("left", () => {
        handleSongSwitch(() => {
            logListen();
            dislikeSong(songToDislike);
        });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isCardAnimating = false;
            });
        });
    });
});
document.getElementById("like-btn").addEventListener("click", () => {
    if (!window.currentSongObject) {
        console.warn("⚠️ No current song object yet!");
        return;
    }
    if (isCardAnimating || cardIsLoading) {
        console.warn("⏳ Card still loading, ignoring swipe.");
        return;
    }
    isCardAnimating = true;
    const songToLike = { ...window.currentSongObject };
    showSwipePopup("like");
    animateSwipe("right", () => {
        handleSongSwitch(() => {
            logListen();
            likeSong(songToLike);
        });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isCardAnimating = false;
            });
        });
    });
});

// ==============================
// ====== CARD DRAGGING LOGIC ====
// ==============================
(function setupMainCardDrag() {
    let mainCard = document.getElementById("mainCard");
    let startX = 0, startY = 0, lastX = 0, lastY = 0, dragging = false, draggingDirection = null;
    let cardWidth = mainCard ? mainCard.getBoundingClientRect().width : 0;
    const thresholdFraction = 0.33;
    const minThresholdPx = 120;
    const upSwipeFraction = 0.25;
    const minUpPx = 80;

    function setCardTransition(card, on) { card.style.transition = on ? 'transform 0.25s ease-in-out' : 'none'; }

    function clearAllPopups() {
        document.querySelectorAll(".iconPopup").forEach(popup => popup.remove());
    }

    function insertPopup(type, opacity = 1) {
        const iconLocation = document.getElementById("body") || document.body;
        let popupHTML = '';
        if (type === "like") popupHTML = likeIcon;
        else if (type === "dislike") popupHTML = dislikeIcon;
        else if (type === "star") popupHTML = starIcon;
        if (!popupHTML) return null;
        iconLocation.insertAdjacentHTML("beforeend", popupHTML);
        let popup = iconLocation.querySelector(`.${type}Popup`);
        if (!popup) return null;
        popup.style.opacity = opacity;
        popup.style.transition = `opacity 0.08s`;
        popup.style.pointerEvents = "none";
        popup.style.removeProperty("position");
        popup.style.removeProperty("top");
        popup.style.removeProperty("left");
        popup.style.removeProperty("width");
        popup.style.removeProperty("height");
        popup.style.removeProperty("zIndex");
        popup.style.removeProperty("borderRadius");
        popup.style.removeProperty("display");
        popup.style.removeProperty("boxShadow");
        return popup;
    }

    function setCardX(card, x) {
        const maxAngle = 12;
        const percentSwiped = Math.abs(x) / window.innerWidth * 4;
        const iconLocation = document.getElementById("body") || document.body;
        iconLocation.querySelectorAll(".likePopup, .dislikePopup").forEach(el => el.remove());
        if (x === 0) return card.style.transform = ``;
        if (x > 0) {
            insertPopup("like", percentSwiped);
        } else {
            insertPopup("dislike", percentSwiped);
        }
        const angle = Math.max(-maxAngle, Math.min(maxAngle, (x / window.innerWidth) * maxAngle));
        card.style.transform = `translateX(${x}px) rotate(${angle}deg)`;
    }
    function setCardY(card, y) {
        const iconLocation = document.getElementById("body") || document.body;
        iconLocation.querySelectorAll(".likePopup, .dislikePopup").forEach(el => el.remove());
        iconLocation.querySelectorAll(".starPopup").forEach(el => el.remove());
        if (y === 0) {
            card.style.transform = "";
            return;
        }
        card.style.transform = `translateY(${y}px)`;
        let cardHeight = mainCard ? mainCard.offsetHeight || 360 : 360;
        const upThreshold = Math.max(cardHeight * upSwipeFraction, minUpPx);
        const percentSwiped = Math.min(Math.abs(y) / upThreshold, 1.0);
        insertPopup('star', percentSwiped);
    }

    function handleRelease() {
        if (!mainCard) return;
        setCardTransition(mainCard, true);
        const threshold = Math.max(cardWidth * thresholdFraction, minThresholdPx);
        if (draggingDirection === "horizontal") {
            if (Math.abs(lastX) > threshold) {
                const off = (lastX > 0) ? window.innerWidth : -window.innerWidth;
                setCardX(mainCard, off);
                const handler = () => {
                    mainCard.removeEventListener('transitionend', handler);
                    clearAllPopups();
                    if (lastX > 0) {
                        handleSongSwitch(() => { logListen(); likeSong({ ...window.currentSongObject }); });
                    } else {
                        handleSongSwitch(() => { logListen(); dislikeSong({ ...window.currentSongObject }); });
                    }
                };
                mainCard.addEventListener('transitionend', handler);
            } else {
                setCardX(mainCard, 0);
                clearAllPopups();
            }
            return;
        }
        if (draggingDirection === "vertical") {
            let cardHeight = mainCard.offsetHeight || 360;
            const upThreshold = Math.max(cardHeight * upSwipeFraction, minUpPx);
            if (Math.abs(lastY) > upThreshold) {
                mainCard.style.transform = `translateY(${-window.innerHeight * 1.1}px)`;
                const percentSwiped = Math.min(Math.abs(lastY) / upThreshold, 1.0);
                showSwipePopup("star", percentSwiped);
                const handler = () => {
                    mainCard.removeEventListener('transitionend', handler);
                    clearAllPopups();
                    handleSongSwitch(() => {
                        logListen();
                        if (typeof window.currentSongObject === "object" && window.currentSongObject) {
                            try {
                                window.currentSongObject.favorited = true;
                            } catch { }
                        }
                        likeSong({ ...window.currentSongObject, favorited: true });
                    });
                };
                mainCard.addEventListener('transitionend', handler);
            } else {
                setCardTransition(mainCard, true);
                mainCard.style.transform = "";
                clearAllPopups();
            }
        }
    }

    function detectDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy) * 2.2) return "horizontal";
        if (Math.abs(dy) > Math.abs(dx) * 2.2) return "vertical";
        if (Math.abs(dx) > Math.abs(dy)) return "horizontal";
        return "vertical";
    }

    function onTouchStart(e) {
        mainCard = document.getElementById("mainCard");
        if (!mainCard) return;
        if (e.touches.length > 1) return;
        const touch = e.touches[0];
        let el = document.elementFromPoint(touch.clientX, touch.clientY);
        while (el && el !== mainCard) {
            if (el.classList && (el.classList.contains("seekbarContainer") || el.classList.contains("volumeContainer"))) {
                dragging = false;
                draggingDirection = null;
                return;
            }
            el = el.parentElement;
        }
        dragging = true;
        draggingDirection = null;
        setCardTransition(mainCard, false);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastX = 0;
        lastY = 0;
    }

    function onTouchMove(e) {
        if (!dragging) return;
        if (e.touches.length > 1) return;
        mainCard = document.getElementById("mainCard");
        if (!mainCard) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (!draggingDirection) {
            draggingDirection = detectDirection(dx, dy);
        }
        if (draggingDirection === "horizontal") {
            lastX = dx;
            setCardTransition(mainCard, false);
            setCardX(mainCard, dx);
            document.querySelectorAll(".starPopup.iconPopup").forEach(el => el.remove());
        } else if (draggingDirection === "vertical") {
            if (dy < 0) {
                lastY = dy;
                setCardTransition(mainCard, false);
                setCardY(mainCard, dy);
                document.querySelectorAll(".dislikePopup.iconPopup, .likePopup.iconPopup").forEach(el => el.remove());
            } else {
                lastY = 0;
                setCardY(mainCard, 0);
                document.querySelectorAll(".starPopup.iconPopup").forEach(el => el.remove());
            }
        }
        e.preventDefault();
    }

    function onTouchEnd() {
        if (!dragging) return;
        dragging = false;
        handleRelease();
        draggingDirection = null;
    }
    function cleanListeners(card) {
        card.removeEventListener('touchstart', onTouchStart);
        card.removeEventListener('touchmove', onTouchMove);
        card.removeEventListener('touchend', onTouchEnd);
        card.removeEventListener('touchcancel', onTouchEnd);
    }
    function attach() {
        mainCard = document.getElementById("mainCard");
        if (!mainCard) return;
        cleanListeners(mainCard);
        mainCard.addEventListener('touchstart', onTouchStart, { passive: false });
        mainCard.addEventListener('touchmove', onTouchMove, { passive: false });
        mainCard.addEventListener('touchend', onTouchEnd);
        mainCard.addEventListener('touchcancel', onTouchEnd);
    }
    const observer = new MutationObserver(() => { attach(); });
    const observeTarget = () => {
        mainCard = document.getElementById("mainCard");
        if (mainCard) observer.observe(mainCard.parentElement, { childList: true });
    };
    attach();
    observeTarget();
})();

// ==============================
// ========== MENU TOGGLING =====
// ==============================
menuToggleElements.forEach(el => {
    el.addEventListener("click", () => {
        const cardView = document.getElementById("cardView");
        const menuView = document.getElementById("menuView");
        if (!cardView || !menuView) return;
        const cardViewVisible = cardView.style.display !== "none";
        if (cardViewVisible) {
            cardView.style.display = "none";
            menuView.style.display = "";
        } else {
            cardView.style.display = "";
            menuView.style.display = "none";
        }
    });
});

// ==============================
// ========== PLAYLIST UI =======
// ==============================
function renderPlaylistSelection(playlists) {
    const playlistSelectionDiv = document.getElementById("playlistSelection");
    playlistSelectionDiv.innerHTML = "";
    let sortedPlaylists, effectiveLength, indexMap;
    if (playlistDropdownExpanded) {
        sortedPlaylists = [
            playlists[selectedPlaylistIndex],
            ...playlists.filter((_, i) => i !== selectedPlaylistIndex)
        ];
        indexMap = [selectedPlaylistIndex];
        for (let i = 0; i < playlists.length; ++i) {
            if (i !== selectedPlaylistIndex) indexMap.push(i);
        }
        effectiveLength = sortedPlaylists.length;
    } else {
        sortedPlaylists = [playlists[selectedPlaylistIndex]];
        indexMap = [selectedPlaylistIndex];
        effectiveLength = 1;
    }
    for (let idxSorted = 0; idxSorted < effectiveLength; ++idxSorted) {
        const playlistObj = sortedPlaylists[idxSorted];
        const realIdx = indexMap[idxSorted];
        if (!playlistObj) continue;
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("playlistSelectionItem");
        if (!playlistDropdownExpanded && realIdx !== selectedPlaylistIndex)
            itemDiv.classList.add("unselected");
        const emojiP = document.createElement("p");
        emojiP.classList.add("playlistEmoji");
        emojiP.textContent = playlistObj.emoji || "🎵";
        const nameP = document.createElement("p");
        nameP.classList.add("playlistName");
        nameP.textContent = playlistObj.name;
        itemDiv.appendChild(emojiP);
        itemDiv.appendChild(nameP);
        itemDiv.addEventListener("click", () => {
            if (selectedPlaylistIndex !== realIdx) {
                selectedPlaylistIndex = realIdx;
                playlistDropdownExpanded = false;
                renderPlaylistSelection(playlists);
                const playlistSelection = document.getElementById("playlistSelection");
                playlistSelection.style.height = "";
                playlistSelection.style.removeProperty("height");
                const dropdown = document.getElementById("playlistSelectionDropdown");
                if (dropdown) {
                    dropdown.style.transform = "";
                    dropdown.style.top = "";
                }
                renderSongList(playlists, selectedPlaylistIndex);
            }
        });
        playlistSelectionDiv.appendChild(itemDiv);
    }
}
cardViewMenuButton.addEventListener("click", () => {
    const playlistSelectionDiv = document.getElementById("playlistSelection");
    if (!playlistSelectionDiv) return;
    const playlists = requestPlaylistList();
    playlistDropdownExpanded = false;
    renderPlaylistSelection(playlists);
    renderSongList(playlists, selectedPlaylistIndex);
});

// ==============================
// === DROPDOWN EXPAND/COLLAPSE =
// ==============================
(function () {
    const dropdown = document.getElementById("playlistSelectionDropdown");
    const selectionDiv = document.getElementById("playlistSelection");

    let dropdownIcon;
    if (dropdown) {
        dropdownIcon = dropdown.querySelector("svg") || dropdown;
    }

    function expandDropdown() {
        if (!playlistDropdownExpanded) {
            const playlists = requestPlaylistList();
            playlistDropdownExpanded = true;
            const collapsedHeight = selectionDiv.offsetHeight;
            renderPlaylistSelection(playlists);
            const expandedHeight = selectionDiv.scrollHeight;
            selectionDiv.style.height = `${collapsedHeight}px`;
            selectionDiv.offsetHeight;
            requestAnimationFrame(() => {
                selectionDiv.style.height = `${expandedHeight}px`;
                const handleTransitionEnd = (e) => {
                    if (e.target === selectionDiv && e.propertyName === 'height') {
                        selectionDiv.removeEventListener('transitionend', handleTransitionEnd);
                        selectionDiv.style.height = "auto";
                    }
                };
                selectionDiv.addEventListener('transitionend', handleTransitionEnd);
            });
            if (dropdown) {
                dropdown.style.transform = "rotate(180deg)";
                dropdown.style.top = "calc((16 - 1) / var(--simWidth) * 100vw)";
            }
        }
    }
    function collapseDropdown() {
        if (playlistDropdownExpanded) {
            const playlists = requestPlaylistList();
            playlistDropdownExpanded = false;
            const expandedHeight = selectionDiv.scrollHeight;
            renderPlaylistSelection(playlists);
            const collapsedHeight = selectionDiv.scrollHeight;
            selectionDiv.style.height = `${expandedHeight}px`;
            selectionDiv.offsetHeight;
            requestAnimationFrame(() => {
                selectionDiv.style.height = `${collapsedHeight}px`;
                const handleTransitionEnd = (e) => {
                    if (e.target === selectionDiv && e.propertyName === 'height') {
                        selectionDiv.removeEventListener('transitionend', handleTransitionEnd);
                        selectionDiv.style.height = "";
                        selectionDiv.style.removeProperty("height");
                    }
                };
                selectionDiv.addEventListener('transitionend', handleTransitionEnd);
            });
            if (dropdown) {
                dropdown.style.transform = "";
                dropdown.style.top = "";
            }
        }
    }

    if (selectionDiv) {
        selectionDiv.addEventListener("click", function (e) {
            if (playlistDropdownExpanded) return;
            expandDropdown();
        }, true);
    }
    if (dropdown) {
        dropdown.addEventListener("click", function (e) {
            e.stopPropagation();
            if (!playlistDropdownExpanded) {
                expandDropdown();
            } else {
                collapseDropdown();
            }
        }, true);
        if (dropdownIcon && dropdownIcon !== dropdown) {
            dropdownIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                if (!playlistDropdownExpanded) {
                    expandDropdown();
                } else {
                    collapseDropdown();
                }
            }, true);
        }
    }
})();

// ==============================
// ===== SEARCH FUNCTIONALITY ===
// ==============================
(function setupSearchMenuHandlers() {
    const searchInput = document.getElementById("menuTextInput");
    const clearButton = document.getElementById("clearSearchButton");

    let lastSearchValue = "";

    function normalizeSearchString(str) {
        if (typeof str !== "string") return "";
        return str
            .toLowerCase()
            .replace(/['’"`,.\(\)\-:;!?\/\\\[\]{}]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getSearchValue() {
        return (searchInput && typeof searchInput.value === "string")
            ? searchInput.value.trim()
            : "";
    }

    window.renderSongList = async function (playlists, playlistIdx = selectedPlaylistIndex, searchQuery) {
        const listItemsDiv = document.getElementById("listItems");
        if (!listItemsDiv) return;
        listItemsDiv.innerHTML = "";
        let playlistArr;
        const playlistName = playlists[playlistIdx]?.name || "All";
        playlistArr = requestSongList(playlistName);
        const playlistObj = Array.isArray(playlistArr) && playlistArr.length > 0 ? playlistArr[0] : null;
        if (!playlistObj || !Array.isArray(playlistObj.songList)) return;
        let songList = playlistObj.songList;

        if (typeof searchQuery === "string" && searchQuery.length > 0) {
            const rawQ = searchQuery.trim();
            const q = normalizeSearchString(rawQ);

            function includesForgiving(field) {
                if (!field) return false;
                return normalizeSearchString(String(field)).includes(q);
            }

            songList = songList.filter(
                song =>
                    includesForgiving(song.title) ||
                    includesForgiving(song.name) ||
                    includesForgiving(song.artist) ||
                    (song.rank != null && normalizeSearchString(String(song.rank)).includes(q)) ||
                    includesForgiving(song.genre)
            );
        }

        document.addEventListener("click", async (e) => {
            const share = e.target.closest(".share");
            if (share) {
                const link = share.dataset.link;
                if (!link) return console.error("❌ No link found!");
                try {
                    await navigator.clipboard.writeText(link);
                    showCopyToast("Link copied!");
                } catch (err) {
                    console.error("Failed to copy:", err);
                }
            }
        });

        const renderSongMenuItem = async (song) => {
            const query = song.title || song.name || "";
            if (window.debug) console.log(song);
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}`;
            let songData = null;
            try {
                const response = await fetch(url);
                const data = await response.json();
                const results = (data.results || []).filter((item) => item.kind === "song");
                if (!results.length) songData = null;
                else songData = results[0];
            } catch (e) { songData = null; }
            if (!songData) return null;
            const menuItem = document.createElement("div");
            menuItem.className = "menuItem";
            const part1 = document.createElement("div");
            part1.className = "part1";
            const img = document.createElement("img");
            img.className = "menuItemImage";
            img.src = songData.artworkUrl100 ? songData.artworkUrl100.replace("100x100", "1500x1500") : (song.image || "");
            img.alt = songData.trackName && songData.artistName
                ? `${songData.trackName} by ${songData.artistName}`
                : (query ? query : "Unknown");
            const songInfo = document.createElement("p");
            songInfo.className = "songInfo";
            songInfo.innerHTML = `
                Genre: ${songData?.primaryGenreName || song.genre || "Unknown"}<br />
                Rank: ${song.rank != null ? song.rank : "-"}<br />
                Release: ${songData?.releaseDate
                    ? (typeof formatDate === "function" ? formatDate(songData.releaseDate) : songData.releaseDate.slice(0, 10))
                    : (song.release || "")
                }
            `;
            part1.appendChild(img); part1.appendChild(songInfo);
            const part2 = document.createElement("div");
            part2.className = "part2";
            const title = document.createElement("p");
            title.className = "title";
            title.textContent = songData?.trackName || song.title || "Untitled";
            const artist = document.createElement("p");
            artist.className = "artist";
            artist.textContent = songData?.artistName || song.artist || "";
            part2.appendChild(title); part2.appendChild(artist);
            const part3 = document.createElement("div");
            part3.className = "part3";
            const starDiv = document.createElement("div");
            starDiv.className = "star";
            if (song.favorited) starDiv.classList.add("starred");
            const UNSTARRED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 3l18 18" /><path d="M10.012 6.016l1.981 -4.014l3.086 6.253l6.9 1l-4.421 4.304m.012 4.01l.588 3.426l-6.158 -3.245l-6.172 3.245l1.179 -6.873l-5 -4.867l6.327 -.917" /></svg>`;
            const STARRED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"/></svg>`;
            starDiv.innerHTML = song.favorited ? STARRED_SVG : UNSTARRED_SVG;
            starDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                song.favorited = !song.favorited;
                if (song.favorited) {
                    starDiv.classList.add("starred");
                    starDiv.innerHTML = STARRED_SVG;
                } else {
                    starDiv.classList.remove("starred");
                    starDiv.innerHTML = UNSTARRED_SVG;
                }
            });
            part3.appendChild(starDiv);
            const shareDiv = document.createElement("div");
            shareDiv.className = "share";
            shareDiv.dataset.songName = song.name || song.title;
            shareDiv.dataset.rank = song.rank;
            shareDiv.dataset.playlist = playlistObj.name;
            shareDiv.dataset.link = songData.trackViewUrl;
            shareDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1" /><path d="M12 14v-11" /><path d="M9 6l3 -3l3 3" /></svg>`;
            part3.appendChild(shareDiv);
            const qrCodeDiv = document.createElement("div");
            qrCodeDiv.className = "qrCode";
            qrCodeDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M7 17l0 .01" /><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M7 7l0 .01" /><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M17 7l0 .01" /><path d="M14 14l3 0" /><path d="M20 14l0 .01" /><path d="M14 14l0 3" /><path d="M14 20l3 0" /><path d="M17 17l3 0" /><path d="M20 17l0 3" /></svg>`;
            part3.appendChild(qrCodeDiv);
            qrCodeDiv.dataset.link = songData.trackViewUrl;
            menuItem.appendChild(part1); menuItem.appendChild(part2); menuItem.appendChild(part3);
            return menuItem;
        };

        let firstMenuItemAdded = false;
        for (let i = 0; i < songList.length; ++i) {
            const menuItem = await renderSongMenuItem(songList[i]);
            if (menuItem) {
                if (firstMenuItemAdded) {
                    listItemsDiv.appendChild(document.createElement("hr"));
                }
                listItemsDiv.appendChild(menuItem);
                firstMenuItemAdded = true;
            }
        }
    }

    document.addEventListener("click", (e) => {
        const qrBtn = e.target.closest(".qrCode");
        if (!qrBtn) return;
        const link = qrBtn.dataset.link;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(link)}`;
        const overlay = document.createElement("div");
        overlay.className = "qrOverlay";
        overlay.innerHTML = `
        <div class="qrCard">
            <img class="qrImage" src="${qrUrl}" alt="QR Code">
            <button class="qrClose">Close</button>
        </div>
    `;
        document.body.appendChild(overlay);
        overlay.querySelector(".qrClose").addEventListener("click", () => {
            overlay.remove();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", async e => {
            lastSearchValue = getSearchValue();
            const playlists = requestPlaylistList();
            await window.renderSongList(playlists, selectedPlaylistIndex, lastSearchValue);
        });
    }
    if (clearButton && searchInput) {
        clearButton.addEventListener("click", async function () {
            searchInput.value = "";
            lastSearchValue = "";
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);
        });
    }
})();

// ==============================
// ======= TITLE MARQUEE ========
// ==============================
function applyTitleMarqueeIfNeeded(el) {
    requestAnimationFrame(() => {
        if (el.scrollWidth <= el.clientWidth + 2) return;
        const text = el.textContent;
        const wrapper = document.createElement("div");
        wrapper.className = "marquee";
        const inner = document.createElement("div");
        inner.className = "marquee__inner";
        [text, text].forEach((t, i) => {
            const span = document.createElement("span");
            span.textContent = t;
            if (i) span.setAttribute("aria-hidden", "true");
            inner.appendChild(span);
        });
        wrapper.appendChild(inner);
        el.textContent = "";
        el.appendChild(wrapper);
        const baseSpeed = 9;
        const factor = Math.min(Math.max(text.length / 20, 0.7), 2.5);
        inner.style.animationDuration = `${baseSpeed * factor}s`;
        const computeDistance = () => {
            const styles = getComputedStyle(inner);
            const gap = parseFloat(styles.gap || styles.columnGap || "0") || 0;
            const distance = Math.ceil(inner.firstChild.offsetWidth + gap);
            inner.style.setProperty("--marquee-distance", `${distance}px`);
            const anim = inner.style.animation;
            inner.style.animation = "none";
            inner.offsetHeight;
            inner.style.animation = anim;
        };
        computeDistance();
        window.addEventListener("resize", computeDistance);
        window.addEventListener("orientationchange", computeDistance);
        el._cleanupMarquee = () => {
            window.removeEventListener("resize", computeDistance);
            window.removeEventListener("orientationchange", computeDistance);
        };
    });
}

// ==============================
// ===== QR CODE GENERATOR ======
// ==============================
function showQRPopup(link) {
    const overlay = document.createElement("div");
    overlay.className = "qrOverlay";
    const popup = document.createElement("div");
    popup.className = "qrPopup";
    popup.innerHTML = `
        <img class="qrImage" 
             src="https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=${encodeURIComponent(link)}" 
             alt="QR Code">
        <p class="qrText">Scan to open</p>
        <button class="qrClose">Close</button>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target.classList.contains("qrClose")) {
            overlay.remove();
        }
    });
}

// ==============================
// ===== iOS RANGE HANDLING =====
// ==============================
function iosRangeTouchHandler(e) {
    if (e.touches.length > 1) return;
    const input = e.target;
    const rect = input.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    let percent = (touch.pageX - rect.left - window.scrollX) / rect.width;
    percent = Math.min(Math.max(percent, 0), 1);
    const min = parseFloat(input.min || 0);
    const max = parseFloat(input.max || 100);
    const step = parseFloat(input.step || 1);
    let value = min + percent * (max - min);
    value = Math.round((value - min) / step) * step + min;
    value = Math.min(Math.max(value, min), max);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    e.preventDefault();
}
function attachIOSRangeHandlers() {
    if (/iPhone|iPad|iPod/.test(navigator.platform)) {
        document.querySelectorAll('input[type="range"]').forEach((slider) => {
            if (!slider._iosHandlerAttached) {
                slider.addEventListener("touchstart", iosRangeTouchHandler, { passive: false });
                slider.addEventListener("touchmove", iosRangeTouchHandler, { passive: false });
                slider._iosHandlerAttached = true;
            }
        });
    }
}
attachIOSRangeHandlers();

// ==============================
// ========= INIT SONGS =========
// ==============================
(async function initSongs() {
    currentSong = requestSong();
    nextSong = requestSong();
    await fetchAndDisplaySong(currentSong, "mainCard");
    await fetchAndDisplaySong(nextSong, "nextCard");
    lockCardsHeightOnceLoaded();
})();

// ==============================
// ========= CARD HEIGHT ========
// ==============================
function lockCardsHeightOnceLoaded(mainEl = null, nextEl = null) {
    const cardsContainer = document.getElementById("cards");
    if (cardsContainer.dataset.locked === "true") return;
    mainEl ||= document.getElementById("mainCard");
    nextEl ||= document.getElementById("nextCard");
    if (!mainEl || !nextEl) return;
}

// ==============================
// ========= BORDER RADIUS ======
// ==============================
const rerunApplySquircles = () => {
    if (typeof window.applySquircles === "function") {
        window.applySquircles();
    }
};
["resize", "orientationchange", "DOMContentLoaded", "load", "transitionend", "animationend"].forEach(evt => {
    window.addEventListener(evt, rerunApplySquircles, true);
});
(new MutationObserver(rerunApplySquircles)).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"]
});
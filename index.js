// =============================
// ========== IMPORTS ==========
// =============================
import { updateTasteProfile } from "./backend/songify_logic.js";
import { songs, requestSong, dislikeSong, likeSong, requestSongList, requestPlaylistList } from "./backend.js";
import { debug } from "./globalSettings.js";

// =============================
// ========= CONSTANTS =========
// =============================

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

// =============================
// === PWA INSTALL FUNCTIONS ===
// =============================

let deferredPrompt = null;

function hideInstallButton() { installBtn.style.display = "none"; }
function showInstallButton() { installBtn.style.display = ""; }
function checkInstallState() {
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true ||
        document.referrer.includes("android-app://");
    if (isStandalone) hideInstallButton();
}

// Register service worker and handle PWA install UI
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

// =============================
// ==== UTILITY FUNCTIONS ======
// =============================

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

// =============================
// == SONG FETCHING FUNCTIONS ==
// =============================

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

        // Elements
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

// =============================
// == AUDIO PLAYER MANAGEMENT ==
// =============================

let playBtn = document.querySelector("#mainCard .play");
let pauseBtn = document.querySelector("#mainCard .pause");
let seekbar = document.querySelector("#mainCard .seekbar");
let currentTimeLabel = document.querySelector("#mainCard .currentTimeLabel");
let durationLabel = document.querySelector("#mainCard .durationLabel");

function refreshAudioPlayerElements() {
    playBtn = document.querySelector("#mainCard .play");
    pauseBtn = document.querySelector("#mainCard .pause");
    seekbar = document.querySelector("#mainCard .seekbar");
    currentTimeLabel = document.querySelector("#mainCard .currentTimeLabel");
    durationLabel = document.querySelector("#mainCard .durationLabel");
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
        // 1. Record listen percentage
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
        // 3. replay behavior
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
}

setupAudioPlayerListeners();

// =============================
// ======= CARD HEIGHT =========
// =============================

function lockCardsHeightOnceLoaded(mainEl = null, nextEl = null) {
    const cardsContainer = document.getElementById("cards");
    if (cardsContainer.dataset.locked === "true") return;
    mainEl ||= document.getElementById("mainCard");
    nextEl ||= document.getElementById("nextCard");
    if (!mainEl || !nextEl) return;
    // code was commented, left here
}

// =============================
// ======== LISTEN LOGGING =====
// =============================

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

// =============================
// =======  SONG SWITCH   ======
// =============================

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

// =============================
// ========== SWIPES ===========
// =============================

function showSwipePopup(type) {
    const existing = document.querySelector(".iconPopup");
    if (existing) existing.remove();

    const popupHTML = type === "like" ? likeIcon : dislikeIcon;
    document.body.insertAdjacentHTML("beforeend", popupHTML);

    const popup = document.querySelector(`.${type}Popup`);
    if (!popup) return;

    popup.style.opacity = "1";
    popup.style.transition = "opacity 0.4s ease";
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
    const off = (direction === "right" ? 1 : -1) * window.innerWidth;
    mainCard.style.transition = 'transform 0.25s ease-in-out';
    const maxAngle = 12;
    const angle = direction === "right" ? maxAngle : -maxAngle;
    mainCard.style.transform = `translateX(${off}px) rotate(${angle}deg)`;

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

// =============================
// ===== MAIN CARD DRAGGING ====
// =============================

(function setupMainCardDrag() {
    // Drag-related state
    let mainCard = document.getElementById("mainCard");
    let startX = 0, lastX = 0, dragging = false;
    let cardWidth = mainCard ? mainCard.getBoundingClientRect().width : 0;

    const thresholdFraction = 0.33;
    const minThresholdPx = 120;

    function setCardTransition(card, on) {
        card.style.transition = on ? 'transform 0.25s ease-in-out' : 'none';
    }

    function setCardX(card, x) {
        const maxAngle = 12;
        const percentSwiped = Math.abs(x) / window.innerWidth * 4;
        let iconLocation = document.getElementById("body");
        let iconPopup = iconLocation.querySelector(".iconPopup");

        if (x === 0 && iconPopup) iconPopup.remove();

        if (x !== 0) {
            if (iconPopup) iconPopup.remove();
            if (x > 0) {
                iconLocation.insertAdjacentHTML("beforeend", likeIcon);
                let likeIconElement = document.getElementById("mainCard").querySelector(".dislikePopup");
                iconLocation.querySelector(".likePopup").style.opacity = percentSwiped;
            }
            else {
                iconLocation.insertAdjacentHTML("beforeend", dislikeIcon);
                let dislikeIconElement = document.getElementById("mainCard").querySelector(".likePopup");
                iconLocation.querySelector(".dislikePopup").style.opacity = percentSwiped;
            }
        }
        const angle = Math.max(-maxAngle, Math.min(maxAngle, (x / window.innerWidth) * maxAngle));
        card.style.transform = `translateX(${x}px) rotate(${angle}deg)`;
    }

    function handleRelease() {
        if (!mainCard) return;
        const threshold = Math.max(cardWidth * thresholdFraction, minThresholdPx);
        setCardTransition(mainCard, true);
        if (Math.abs(lastX) > threshold) {
            const off = (lastX > 0) ? window.innerWidth : -window.innerWidth;
            setCardX(mainCard, off);
            const handler = () => {
                if (lastX > 0) {
                    handleSongSwitch(() => { logListen(); likeSong({ ...window.currentSongObject }); });
                } else {
                    handleSongSwitch(() => { logListen(); dislikeSong({ ...window.currentSongObject }); });
                }
            };
            mainCard.addEventListener('transitionend', handler);
        } else {
            setCardX(mainCard, 0);
        }
    }

    function onTouchStart(e) {
        if (!mainCard) return;
        if (e.touches.length > 1) return;
        const touch = e.touches[0];
        let el = document.elementFromPoint(touch.clientX, touch.clientY);
        while (el && el !== mainCard) {
            if (el.classList && (el.classList.contains("seekbarContainer") || el.classList.contains("volumeContainer"))) {
                dragging = false;
                return;
            }
            el = el.parentElement;
        }
        dragging = true;
        setCardTransition(mainCard, false);
        startX = e.touches[0].clientX;
        lastX = 0;
    }
    function onTouchMove(e) {
        if (!dragging) return;
        if (e.touches.length > 1) return;
        if (!mainCard) return;
        const dx = e.touches[0].clientX - startX;
        lastX = dx;
        setCardTransition(mainCard, false);
        setCardX(mainCard, dx);
        e.preventDefault();
    }
    function onTouchEnd(e) { if (!dragging) return; dragging = false; handleRelease(); }
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

// =============================
// ====== MENU TOGGLING ========
// =============================

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

// =============================
// == SONG MENU & PLAYLIST =====
// =============================
function renderPlaylistSelection(playlists) {
    const playlistSelectionDiv = document.getElementById("playlistSelection");
    playlistSelectionDiv.innerHTML = "";

    let sortedPlaylists, effectiveLength;
    if (playlistDropdownExpanded) {
        sortedPlaylists = [
            playlists[selectedPlaylistIndex],
            ...playlists.filter((_, i) => i !== selectedPlaylistIndex)
        ];
        effectiveLength = sortedPlaylists.length;
    } else {
        sortedPlaylists = [playlists[selectedPlaylistIndex]];
        effectiveLength = 1;
    }

    for (let idxSorted = 0; idxSorted < effectiveLength; ++idxSorted) {
        const playlistObj = sortedPlaylists[idxSorted];
        const idx = playlistDropdownExpanded
            ? idxSorted
            : selectedPlaylistIndex;
        if (!playlistObj) continue; // defensive

        const itemDiv = document.createElement("div");
        itemDiv.classList.add("playlistSelectionItem");
        if (!playlistDropdownExpanded && idx !== selectedPlaylistIndex)
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
            if (selectedPlaylistIndex !== idx) {
                selectedPlaylistIndex = idx;
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

async function renderSongList(playlists, playlistIdx = selectedPlaylistIndex) {
    const listItemsDiv = document.getElementById("listItems");
    if (!listItemsDiv) return;
    listItemsDiv.innerHTML = "";

    let playlistArr;
    const playlistName = playlists[playlistIdx]?.name || "All";
    playlistArr = requestSongList(playlistName);

    const playlistObj = Array.isArray(playlistArr) && playlistArr.length > 0 ? playlistArr[0] : null;
    if (!playlistObj || !Array.isArray(playlistObj.songList)) {
        return;
    }
    const songList = playlistObj.songList;

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

        // If no iTunes API result, skip this song
        if (!songData) {
            return null;
        }

        const menuItem = document.createElement("div");
        menuItem.className = "menuItem";

        // part1: image & info
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
        part1.appendChild(img);
        part1.appendChild(songInfo);

        // part2: title & artist
        const part2 = document.createElement("div");
        part2.className = "part2";
        const title = document.createElement("p");
        title.className = "title";
        title.textContent = songData?.trackName || song.title || "Untitled";
        const artist = document.createElement("p");
        artist.className = "artist";
        artist.textContent = songData?.artistName || song.artist || "";
        part2.appendChild(title); part2.appendChild(artist);

        // part3: icons
        const part3 = document.createElement("div");
        part3.className = "part3";

        // star
        const starDiv = document.createElement("div");
        starDiv.className = "star";
        if (song.favorited) starDiv.classList.add("starred");
        if (song.favorited) {
            starDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 3l18 18" /><path d="M10.012 6.016l1.981 -4.014l3.086 6.253l6.9 1l-4.421 4.304m.012 4.01l.588 3.426l-6.158 -3.245l-6.172 3.245l1.179 -6.873l-5 -4.867l6.327 -.917" /></svg>`;
        }
        else {
            starDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"/></svg>`;
        }
        part3.appendChild(starDiv);

        // share
        const shareDiv = document.createElement("div");
        shareDiv.className = "share";
        shareDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1" /><path d="M12 14v-11" /><path d="M9 6l3 -3l3 3" /></svg>`;
        part3.appendChild(shareDiv);

        // qr
        const qrCodeDiv = document.createElement("div");
        qrCodeDiv.className = "qrCode";
        qrCodeDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M7 17l0 .01" /><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M7 7l0 .01" /><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M17 7l0 .01" /><path d="M14 14l3 0" /><path d="M20 14l0 .01" /><path d="M14 14l0 3" /><path d="M14 20l3 0" /><path d="M17 17l3 0" /><path d="M20 17l0 3" /></svg>`;
        part3.appendChild(qrCodeDiv);

        menuItem.appendChild(part1); menuItem.appendChild(part2); menuItem.appendChild(part3);
        return menuItem;
    };

    for (let i = 0; i < songList.length; ++i) {
        const menuItem = await renderSongMenuItem(songList[i]);
        if (menuItem) {
            if (i > 0) {
                const hr = document.createElement("hr");
                listItemsDiv.appendChild(hr);
            }
            listItemsDiv.appendChild(menuItem);
        }
    }
}

(function setupClearButtonHandler() {
    const clearButton = document.getElementById("clearSearchButton");
    const searchInput = document.getElementById("menuTextInput");
    if (!clearButton || !searchInput) return;
    clearButton.addEventListener("click", function () {
        searchInput.value = "";
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
    });
})();

(function () {
    document.getElementById("playlistSelectionDropdown")?.addEventListener("click", function () {
        const playlistSelection = document.getElementById("playlistSelection");
        if (!playlistSelection) return;
        const playlists = requestPlaylistList();
        playlistDropdownExpanded = !playlistDropdownExpanded;

        if (playlistDropdownExpanded) {
            playlistSelection.style.height = "auto";
            const dropdown = document.getElementById("playlistSelectionDropdown");
            if (dropdown) {
                dropdown.style.transform = "rotate(180deg)";
                dropdown.style.top = "calc((16 - 1) / var(--simWidth) * 100vw)";
            }
        } else {
            playlistSelection.style.height = "";
            playlistSelection.style.removeProperty("height");
            const dropdown = document.getElementById("playlistSelectionDropdown");
            if (dropdown) {
                dropdown.style.transform = "";
                dropdown.style.top = "";
            }
        }
        renderPlaylistSelection(playlists);
    });
})();

// =============================
// ======== TITLE MARQUEE ======
// =============================

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

// =============================
// ===== iOS RANGE FIX HANDLER =
// =============================

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

// =============================
// ========= INIT SONGS ========
// =============================

(async function initSongs() {
    currentSong = requestSong();
    nextSong = requestSong();
    await fetchAndDisplaySong(currentSong, "mainCard");
    await fetchAndDisplaySong(nextSong, "nextCard");
    lockCardsHeightOnceLoaded();
})();

// =============================
// =======  BORDER RADIUS ======
// =============================

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
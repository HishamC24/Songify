import { updateTasteProfile } from "./backend/songify_logic.js";



// =============================
// =======  PWA INSTALL  =======
// =============================

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

const installBtn = document.getElementById("install-btn");
let deferredPrompt = null;

function hideInstallButton() {
    installBtn.style.display = "none";
}

function showInstallButton() {
    installBtn.style.display = "";
}

function checkInstallState() {
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true ||
        document.referrer.includes("android-app://");

    if (isStandalone) hideInstallButton();
}

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

// =============================
// ======= SONG FETCHING  ======
// =============================

import { songs, requestSong, dislikeSong, likeSong } from "./backend.js";
import { debug } from "./globalSettings.js";

let mainAudio = null;

// variables for tracking listen %
let listenStartTime = null;
let lastImportPercent = 0;

let mainPreviewUrl = null;

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

async function fetchAndDisplaySong(songName, divID) {
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
    } catch (err) {
        console.error("Error fetching data:", err, songName);
    }
}

function handleNoSong(divID) {
    if (debug) console.warn("No song results found.");
    if (divID !== "mainCard") return;

    resetAudio();
}

// =============================
// ======= AUDIO PLAYER  =======
// =============================

let playBtn = document.querySelector("#main .play");
let pauseBtn = document.querySelector("#main .pause");
let seekbar = document.querySelector("#main .seekbar");
let currentTimeLabel = document.querySelector("#main .currentTimeLabel");
let durationLabel = document.querySelector("#main .durationLabel");

function refreshAudioPlayerElements() {
    playBtn = document.querySelector("#main .play");
    pauseBtn = document.querySelector("#main .pause");
    seekbar = document.querySelector("#main .seekbar");
    currentTimeLabel = document.querySelector("#main .currentTimeLabel");
    durationLabel = document.querySelector("#main .durationLabel");
}

if (pauseBtn) pauseBtn.style.display = "none";

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

                updateTasteProfile(window.currentSongObject, {
                    listen: true,
                    listenPercent: listenPercent,
                });

                if (debug) console.log(`🎧 Logged listenPercent: ${listenPercent.toFixed(1)}%`);
            }
        } catch (err) {
            console.warn("⚠️ Listen% tracking error:", err);
        }

        // 2. reset timer
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
            listenStartTime = Date.now(); // start tracking listening time
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

function lockCardsHeightOnceLoaded(mainEl = null, nextEl = null) {
    const cardsContainer = document.getElementById("cards");

    if (cardsContainer.dataset.locked === "true") return;

    mainEl ||= document.getElementById("mainCard");
    nextEl ||= document.getElementById("nextCard");

    if (!mainEl || !nextEl) return;

    // requestAnimationFrame(() => {
    //     const maxHeight = Math.max(mainEl.offsetHeight, nextEl.offsetHeight);
    //     cardsContainer.style.height = `${maxHeight}px`;
    //     cardsContainer.style.position = "relative";
    //     cardsContainer.dataset.locked = "true";
    //     if (debug) console.log(`Cards height locked at ${maxHeight}px`);
    // });
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

// Global song state variables
let currentSong;
let nextSong;
let currentSongJson = {};



(async function initSongs() {

    currentSong = requestSong();
    nextSong = requestSong();

    await fetchAndDisplaySong(currentSong, "mainCard");
    await fetchAndDisplaySong(nextSong, "nextCard");

    lockCardsHeightOnceLoaded();

})();

let nextCardHTML = `
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
`

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
`
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
`

let mainCardPlaying = false;

function showSwipePopup(type) {
    const existing = document.querySelector(".iconPopup");
    if (existing) existing.remove();

    const popupHTML = type === "like" ? likeIcon : dislikeIcon;
    document.body.insertAdjacentHTML("beforeend", popupHTML);

    const popup = document.querySelector(`.${type}Popup`);
    if (!popup) return;

    popup.style.opacity = "1";
    popup.style.transition = "opacity 0.4s ease";

    // Fade out after a short delay
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
    } else {
        cardsContainer.insertAdjacentHTML("beforeend", nextCardHTML);
    }
    if (typeof window.applySquircles === "function") {
        window.applySquircles();
    }

    nextSong = requestSong();
    fetchAndDisplaySong(nextSong, "nextCard");

    refreshAudioPlayerElements();
    setupAudioPlayerListeners();
    attachIOSRangeHandlers();

    // nextCard.style.opacity = ""; // this doesnt work since what the new "nextCard" is doesnt get updated
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
window.animateSwipe = animateSwipe;

// fixed timing for dislike
document.getElementById("dislike-btn").addEventListener("click", () => {
    if (!window.currentSongObject) return console.warn("⚠️ No current song object yet!");

    // capture it NOW before switching
    const songToDislike = { ...window.currentSongObject };

    showSwipePopup("dislike");
    animateSwipe("left", () =>

        handleSongSwitch(() => {
            // send signals after dislike
            logListen();
            dislikeSong(songToDislike);

            // yet to implement:
            // isfavorite
            // isShared
        })
    );
});

document.getElementById("like-btn").addEventListener("click", () => {
    if (!window.currentSongObject) return console.warn("⚠️ No current song object yet!");

    const songToLike = { ...window.currentSongObject };

    showSwipePopup("like");
    animateSwipe("right", () =>

        handleSongSwitch(() => {

            // send signals after like
            logListen();
            likeSong(songToLike);

            // yet to implement:
            // isfavorite
            // isShared
        })
    );
});

// =============================
// =======  TITLE MARQUEE ======
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
// == CARD DRAG MOBILE GESTURE =
// =============================

(function setupMainCardDrag() {
    let mainCard = document.getElementById("mainCard");

    let startX = 0;
    let lastX = 0;
    let dragging = false;
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

        if (x === 0 && iconPopup) {
            iconPopup.remove();
        }

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


    // function resetCard() {
    //     if (!mainCard) return;
    //     setCardTransition(mainCard, true);
    //     setCardX(mainCard, 0);
    // }

    function handleRelease() {
        if (!mainCard) return;
        const threshold = Math.max(cardWidth * thresholdFraction, minThresholdPx);
        setCardTransition(mainCard, true);
        if (Math.abs(lastX) > threshold) {
            const off = (lastX > 0) ? window.innerWidth : -window.innerWidth;
            setCardX(mainCard, off);
            const handler = () => {
                if (lastX > 0) {
                    handleSongSwitch(likeSong);
                } else {
                    handleSongSwitch(dislikeSong);
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

    function onTouchEnd(e) {
        if (!dragging) return;
        dragging = false;
        handleRelease();
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

    const observer = new MutationObserver(() => {
        attach();
    });
    const observeTarget = () => {
        mainCard = document.getElementById("mainCard");
        if (mainCard) observer.observe(mainCard.parentElement, { childList: true });
    };
    attach();
    observeTarget();
})();

const menuToggleElements = document.querySelectorAll('.menuToggle');
menuToggleElements.forEach(el => {
    el.addEventListener("click", () => {
        const cardView = document.getElementById("cardView");
        const menuView = document.getElementById("menuView");

        if (!cardView || !menuView) return;

        // Check current state: is cardView visible?
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

function populateList() {
    songs = []
}



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
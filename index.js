// =========================
// ===== PWA INSTALL =======
// =========================

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

// Initial check
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

// =========================
// ===== SONG FETCHING =====
// =========================

import { songs, requestSong, dislikeSong } from "./backend.js";

let mainAudio = null;
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

        const results = (data.results || []).filter((item) => item.kind === "song");
        if (!results.length) return handleNoSong(divID);

        const song = results[0];
        const card = document.getElementById(divID);
        if (!card) return console.warn("No such div ID:", divID);

        const img = card.querySelector("img");
        const titleElem = card.querySelector(".title");
        const artistElem = card.querySelector(".artist");
        const explicitElem = card.querySelector(".explicitcy");
        const detailsElem = card.querySelector(".details");

        // Update image
        if (img) {
            img.src = song.artworkUrl100.replace("100x100", "5000x5000");
            img.alt = `${song.trackName} by ${song.artistName}`;
        }

        // Title and artist
        if (titleElem) {
            titleElem.textContent = song.trackName;
            applyTitleMarqueeIfNeeded(titleElem);
        }
        if (artistElem) artistElem.textContent = song.artistName;

        // Explicit label
        if (explicitElem) {
            explicitElem.querySelectorAll(".explicit-marker").forEach((el) => el.remove());
            if (song.trackExplicitness === "explicit") {
                const marker = document.createElement("b");
                marker.className = "explicit-marker";
                marker.textContent = "E";
                explicitElem.prepend(marker);
            }
        }

        // Genre + release
        if (detailsElem) {
            detailsElem.innerHTML = `
          Genre: ${song.primaryGenreName || ""}<br>
          Release: ${formatDate(song.releaseDate)}
        `;
        }

        // Audio setup for main card
        if (divID === "main") setupMainAudio(song.previewUrl);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function handleNoSong(divID) {
    console.warn("No song results found.");
    if (divID !== "main") return;

    resetAudio();
}

// =========================
// ===== AUDIO PLAYER ======
// =========================

const playBtn = document.querySelector("#main .play");
const pauseBtn = document.querySelector("#main .pause");
const seekbar = document.querySelector("#main .seekbar");
const currentTimeLabel = document.querySelector("#main .currentTimeLabel");
const durationLabel = document.querySelector("#main .durationLabel");

pauseBtn.style.display = "none";

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
    audio.addEventListener("ended", resetAudio);
}

playBtn.addEventListener("click", () => {
    if (!mainAudio || !mainPreviewUrl) return;
    mainAudio.currentTime = 0;
    mainAudio.play();
    playBtn.style.display = "none";
    pauseBtn.style.display = "inline";
});

pauseBtn.addEventListener("click", () => {
    if (!mainAudio) return;
    mainAudio.pause();
    playBtn.style.display = "inline";
    pauseBtn.style.display = "none";
});

// =========================
// ====== SONG SWITCH ======
// =========================

let currentSong = requestSong();
let nextSong = requestSong();

fetchAndDisplaySong(currentSong, "main");
fetchAndDisplaySong(nextSong, "next");

document.getElementById("dislikeBtn").addEventListener("click", () => {
    dislikeSong(currentSong);
    currentSong = nextSong;
    fetchAndDisplaySong(currentSong, "main");

    nextSong = requestSong();
    fetchAndDisplaySong(nextSong, "next");
});

// =========================
// ===== TITLE MARQUEE =====
// =========================

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
            inner.offsetHeight; // force reflow
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

// ================================
// ===== iOS RANGE FIX HANDLER ====
// ================================

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

if (/iPhone|iPad|iPod/.test(navigator.platform)) {
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
        slider.addEventListener("touchstart", iosRangeTouchHandler, { passive: false });
        slider.addEventListener("touchmove", iosRangeTouchHandler, { passive: false });
    });
}

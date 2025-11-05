
// =========================
// ===== PWA INSTALL =======
// =========================
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

let deferredPrompt = null;
const installBtn = document.getElementById("install-btn");

// Hide button if already installed or running as PWA
function checkInstallState() {
    // Check if running in standalone mode (already installed as PWA)
    if (window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://")) {
        installBtn.style.display = "none";
    }
}

// Check on page load
checkInstallState();

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "";
});

installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    installBtn.style.display = "none";
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});

window.addEventListener("appinstalled", () => {
    installBtn.style.display = "none";
    deferredPrompt = null;
});

/**
 * Fetches song data for the given songName and populates UI elements inside the specified divID.
 * Also sets up audio preview if divID is "main".
 * 
 * @param {string} songName - The name of the song to search for.
 * @param {string} divID - The ID of the container div where the song info should be placed.
 */
let mainAudio = null;
let mainPreviewUrl = null;

function fetchAndDisplaySong(songName, divID) {
    const searchQuery =
        "https://itunes.apple.com/search?term=" + encodeURIComponent(songName);

    let searchResult;

    fetch(searchQuery)
        .then((response) => response.json())
        .then((json) => {
            if (json && Array.isArray(json.results)) {
                json.results = json.results.filter((item) => item.kind === "song");
            }

            searchResult = json;
            console.log(searchResult);

            if (searchResult.results && searchResult.results.length > 0) {
                const first = searchResult.results[0];
                // const artworkUrl = first.artworkUrl100.replace("100x100", "5000x5000");
                const cardDiv = document.getElementById(divID);
                if (!cardDiv) {
                    console.warn("No such div ID:", divID);
                    return;
                }

                // Set .card > img (first img in this container)
                const mainImg = cardDiv.querySelector("img");
                if (mainImg) {
                    mainImg.src = first.artworkUrl100.replace("100x100", "5000x5000");
                    mainImg.alt = first.trackName + " by " + first.artistName;
                }

                // Title and artist in this card only
                const titleElem = cardDiv.querySelector(".title");
                const artistElem = cardDiv.querySelector(".artist");
                if (titleElem) {
                    titleElem.textContent = first.trackName;
                    applyTitleMarqueeIfNeeded(titleElem);
                }
                if (artistElem) {
                    artistElem.textContent = first.artistName;
                }

                // Explicit marker in this card
                const explicitDiv = cardDiv.querySelector(".explicitcy");
                if (explicitDiv) {
                    // Remove any previous explicit marker
                    explicitDiv.querySelectorAll(".explicit-marker").forEach(el => el.remove());
                    if (first.trackExplicitness && first.trackExplicitness === "explicit") {
                        const boldE = document.createElement("b");
                        boldE.className = "explicit-marker";
                        boldE.textContent = "E";
                        explicitDiv.insertBefore(boldE, explicitDiv.firstChild);
                    }
                }

                // Details update (genre/release info) in this card
                const detailsElem = cardDiv.querySelector(".details");
                if (detailsElem) {
                    let genre = first.primaryGenreName || "";
                    let releaseDateStr = "";
                    if (first.releaseDate) {
                        const dateObj = new Date(first.releaseDate);
                        const month = dateObj.toLocaleString("en-US", { month: "long" });
                        const day = dateObj.getDate();
                        const year = dateObj.getFullYear();
                        releaseDateStr = `${month} ${day}, ${year}`;
                    }
                    detailsElem.innerHTML = `
                        Genre: ${genre}<br>
                        Release: ${releaseDateStr}
                    `;
                }

                // If setting main card, also set up audio preview
                if (divID === "main") {
                    mainPreviewUrl = first.previewUrl || null;
                    if (mainAudio) {
                        mainAudio.pause();
                    }
                    if (mainPreviewUrl) {
                        mainAudio = new Audio(mainPreviewUrl);
                        setupAudioProgressTracking(mainAudio);
                        setupAudioEndedHandler(mainAudio);
                    } else {
                        mainAudio = null;
                    }
                    // Always reset UI to play button ready state
                    if (playBtn && pauseBtn) {
                        playBtn.style.display = "";
                        pauseBtn.style.display = "none";
                    }
                    // Reset slider and time labels
                    if (seekbar) {
                        seekbar.value = 0;
                        seekbar.max = 30; // Reset to default
                    }
                    if (currentTimeLabel) {
                        currentTimeLabel.textContent = "00:00";
                    }
                    if (durationLabel) {
                        durationLabel.textContent = "00:30";
                    }
                }
            } else {
                console.warn("No song results found.");
                // If main card and no result, clear audio for safety.
                if (divID === "main") {
                    if (mainAudio) mainAudio.pause();
                    mainAudio = null;
                    mainPreviewUrl = null;
                    if (playBtn && pauseBtn) {
                        playBtn.style.display = "";
                        pauseBtn.style.display = "none";
                    }
                    // Reset slider and time labels
                    if (seekbar) {
                        seekbar.value = 0;
                        seekbar.max = 30;
                    }
                    if (currentTimeLabel) {
                        currentTimeLabel.textContent = "00:00";
                    }
                    if (durationLabel) {
                        durationLabel.textContent = "00:30";
                    }
                }
            }
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
}

import { songs, requestSong, dislikeSong } from "./backend.js";

// Start with two songs: main and next
let currentSong = requestSong();
let nextSong = requestSong();

fetchAndDisplaySong(currentSong, "main");
fetchAndDisplaySong(nextSong, "next");

const dislikeBtn = document.getElementById("dislikeBtn");
dislikeBtn.addEventListener("click", () => {
    // Dislike the current main song
    dislikeSong(currentSong);

    // Move next song into main slot
    currentSong = nextSong;

    // Display it
    fetchAndDisplaySong(currentSong, "main");

    // Fetch a new next song
    nextSong = requestSong();
    fetchAndDisplaySong(nextSong, "next");
});


/**
 * If the title overflows its container, apply a marquee scrolling effect.
 */
function applyTitleMarqueeIfNeeded(titleElement) {
    // Ensure layout is computed before measuring
    requestAnimationFrame(() => {
        const needsScroll = titleElement.scrollWidth > titleElement.clientWidth + 2;
        if (!needsScroll) return;

        const titleText = titleElement.textContent || "";

        // Build marquee structure
        const wrapper = document.createElement("div");
        wrapper.className = "marquee";
        const inner = document.createElement("div");
        inner.className = "marquee__inner";

        const span1 = document.createElement("span");
        span1.textContent = titleText;
        const span2 = document.createElement("span");
        span2.textContent = titleText;
        span2.setAttribute("aria-hidden", "true");

        inner.appendChild(span1);
        inner.appendChild(span2);
        wrapper.appendChild(inner);

        // Replace original content
        titleElement.textContent = "";
        titleElement.appendChild(wrapper);

        // Adjust animation speed relative to text length for readability
        const baseDurationSeconds = 9;
        const lengthFactor = Math.min(Math.max(titleText.length / 20, 0.7), 2.5);
        inner.style.animationDuration = `${baseDurationSeconds * lengthFactor}s`;

        // Compute exact scroll distance (width of one copy + gap)
        const computeAndSetDistance = () => {
            const styles = getComputedStyle(inner);
            const gapPx = parseFloat(styles.columnGap || styles.gap || "0") || 0;
            const distance = Math.ceil(span1.offsetWidth + gapPx);
            inner.style.setProperty("--marquee-distance", `${distance}px`);

            // Restart animation to avoid visual jumps on dimension change
            const currentAnimation = inner.style.animation;
            inner.style.animation = "none";
            // Force reflow
            // eslint-disable-next-line no-unused-expressions
            inner.offsetHeight;
            inner.style.animation = currentAnimation || "";
        };

        computeAndSetDistance();

        // Recompute on resize/orientation changes
        const onResize = () => computeAndSetDistance();
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        // Store cleanup on element for potential future use
        titleElement._cleanupMarquee = () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    });
}


// =========================
// ===== AUDIO PLAYER ======
// =========================

const playBtn = document.querySelector("#main .play");
const pauseBtn = document.querySelector("#main .pause");
const seekbar = document.querySelector("#main .seekbar");
const currentTimeLabel = document.querySelector("#main .currentTimeLabel");
const durationLabel = document.querySelector("#main .durationLabel");
// Don't create an audio object here;
// instead, use mainAudio/mainPreviewUrl from fetchAndDisplaySong above

pauseBtn.style.display = "none";

// Helper function to format time as MM:SS
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Function to set up audio progress tracking
function setupAudioProgressTracking(audio) {
    if (!audio) return;

    // Update duration when metadata is loaded
    audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        if (seekbar && !isNaN(duration)) {
            seekbar.max = duration;
            if (durationLabel) {
                durationLabel.textContent = formatTime(duration);
            }
        }
    });

    // Update slider and time label as audio plays
    audio.addEventListener("timeupdate", () => {
        if (seekbar && !isNaN(audio.currentTime)) {
            seekbar.value = audio.currentTime;
        }
        if (currentTimeLabel && !isNaN(audio.currentTime)) {
            currentTimeLabel.textContent = formatTime(audio.currentTime);
        }
    });
}

playBtn.addEventListener("click", () => {
    if (mainAudio && mainPreviewUrl) {
        // If already playing, do nothing; else, start playback from start
        // Optionally, you may want to always restart playback on play
        mainAudio.currentTime = 0;
        mainAudio.play();
        playBtn.style.display = "none";
        pauseBtn.style.display = "inline";
    }
});

pauseBtn.addEventListener("click", () => {
    if (mainAudio) {
        mainAudio.pause();
        playBtn.style.display = "inline";
        pauseBtn.style.display = "none";
    }
});

// When song ends, reset buttons and UI
function setupAudioEndedHandler(audio) {
    if (!audio) return;
    audio.addEventListener("ended", function () {
        playBtn.style.display = "";
        pauseBtn.style.display = "none";
        // Reset slider and time display
        if (seekbar) {
            seekbar.value = 0;
        }
        if (currentTimeLabel) {
            currentTimeLabel.textContent = "00:00";
        }
    });
}



// iOS drag support for all range sliders

const diagramSliders = document.querySelectorAll('input[type="range"]');

function iosRangeTouchHandler(e) {
    // Only handle single touch
    if (e.touches.length > 1) return;

    const input = e.target;
    const rect = input.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];

    // Calculate position relative to slider
    let left = rect.left + window.scrollX;
    let width = rect.width;
    let percent = (touch.pageX - left) / width;
    percent = Math.min(Math.max(percent, 0), 1);

    const min = parseFloat(input.min || 0);
    const max = parseFloat(input.max || 100);
    const step = parseFloat(input.step || 1);

    // Map percent to value
    let rawValue = min + percent * (max - min);
    // Snap to nearest step
    let steppedValue = Math.round((rawValue - min) / step) * step + min;
    // Clamp
    steppedValue = Math.min(Math.max(steppedValue, min), max);

    input.value = steppedValue;
    // Fire input and change events manually for live updates
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    // Prevent native oddities/cursor stealing
    e.preventDefault();
}

if (/iPhone|iPad|iPod/.test(navigator.platform)) {
    diagramSliders.forEach(slider => {
        slider.addEventListener("touchstart", iosRangeTouchHandler, { passive: false });
        slider.addEventListener("touchmove", iosRangeTouchHandler, { passive: false });
    });
}
// =========================
// 🎶 ZRS Randomizer Logic
// =========================

// =========================
// 🎶 LOAD + FLATTEN WITH PACK NAMES
// =========================

let ostSongs = [];
let dlcSongs = [];
let modSongs = [];

// Helper to flatten objects of arrays while tagging each song with its pack name
function flattenWithPackName(data, packType = "OST") {
  const result = [];

  if (Array.isArray(data)) {
    // If it’s already a simple array of strings
    data.forEach(song => result.push({ song, pack: packType }));
  } else if (typeof data === "object") {
    // Object of packs -> arrays
    for (const [packName, songs] of Object.entries(data)) {
      if (Array.isArray(songs)) {
        songs.forEach(song => result.push({ song, pack: packName }));
      } else {
        result.push({ song: songs, pack: packName });
      }
    }
  }

  return result;
}

// Load JSONs at startup and flatten nested structures, preserving pack names
Promise.all([
  fetch("data/ost.json").then(r => r.json()),
  fetch("data/dlc.json").then(r => r.json()),
  fetch("data/mods.json").then(r => r.json())
])
  .then(([ostData, dlcData, modData]) => {
    const flattenWithPack = (data, sourceLabel) => {
      if (Array.isArray(data)) {
        // flat array, no packs
        return data.map(name => ({ song: name, pack: sourceLabel }));
      }
      if (typeof data === "object") {
        // nested: { "Vol. 1": [..], "Vol. 2": [..] }
        return Object.entries(data).flatMap(([pack, songs]) =>
          songs.map(name => ({ song: name, pack }))
        );
      }
      return [];
    };

    ostSongs = flattenWithPack(ostData, "OST");
    dlcSongs = flattenWithPack(dlcData, "DLC");
    modSongs = flattenWithPack(modData, "Mods");

    console.log(
      `✅ Loaded OST (${ostSongs.length}), DLC (${dlcSongs.length}), MODS (${modSongs.length}) songs`
    );
  })
  .catch(err => console.error("❌ Failed to load song data:", err));

// =========================
// 🎮 DOM ELEMENTS & CONTROLS
// =========================
const reels = {
  map: document.getElementById("map"),
  difficulty: document.getElementById("difficulty"),
  modifier: document.getElementById("modifier"),
};
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("result");

// Checkbox filters
const [ostCheck, dlcCheck, modsCheck] = document.querySelectorAll(
  ".controls input[type='checkbox']"
);

// Constants
const difficulties = ["Easy", "Normal", "Hard", "Expert", "Expert+"];
const modifiers = [
  "No Fail",
  "Insta Fail",
  "Ghost Notes",
  "Faster Song",
  "Disappearing Arrows",
  "No Bombs",
  "Pro Mode",
  "Super Fast Song",
];


// --- existing helpers ---
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSongName(entry) {
  if (typeof entry === "string") return entry;
  if (entry && entry.song) {
    return entry.pack ? `${entry.song} (${entry.pack})` : entry.song;
  }
  return JSON.stringify(entry);
}

function getRandomModifiers() {
  const result = [];
  const count = Math.floor(Math.random() * 3) + 1;
  while (result.length < count) {
    const mod = randomItem(modifiers);
    if (!result.includes(mod)) result.push(mod);
  }
  return result;
}

// --- updated spin logic ---
async function spin() {
  spinButton.disabled = true;
  resultText.textContent = "Spinning... 🎲";

  // Build separate pools
  let songPool = [];
  let displayPool = [];

  if (ostCheck.checked) {
    songPool = songPool.concat(ostSongs);
    displayPool = displayPool.concat(ostSongs);
  }

  if (dlcCheck.checked) {
    songPool = songPool.concat(dlcSongs);
    displayPool = displayPool.concat(dlcSongs);
  }

  if (modsCheck.checked) {
    songPool = songPool.concat(modSongs);
    // Mods don't appear on red cube unless OST/DLC unchecked
  }

  if (songPool.length === 0) {
    resultText.textContent = "Please enable OST, DLC, or Mods!";
    spinButton.disabled = false;
    return;
  }

  // Animate reels
  reels.map.innerHTML = `<span>${getSongName(randomItem(displayPool.length ? displayPool : songPool))}</span>`;
  reels.difficulty.innerHTML = `<span>${randomItem(difficulties)}</span>`;
  reels.modifier.innerHTML = `<span>${randomItem(modifiers)}</span>`;

  setTimeout(() => {
    const finalSong = getSongName(randomItem(displayPool.length ? displayPool : songPool));
    const finalDiff = randomItem(difficulties);
    const finalMods = getRandomModifiers();

    reels.map.innerHTML = `<span>${finalSong}</span>`;
    reels.difficulty.innerHTML = `<span>${finalDiff}</span>`;
    reels.modifier.innerHTML = `<span>${finalMods.join(", ")}</span>`;

    resultText.innerHTML = `🎵 ${finalSong} | 🎚️ ${finalDiff} | 🧩 ${finalMods.join(", ")}`;
    spinButton.disabled = false;
  }, 2200);
}

spinButton.addEventListener("click", spin);

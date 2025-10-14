const maps = [
  "Escape (OST 1)", "Unlimited Power", "Crab Rave",
  "POP/STARS – K/DA", "Spooky Beats DLC", "Angel Voices",
  "100$ Bills", "Origins (Camellia)", "Spin Eternally"
];

const difficulties = ["Easy", "Normal", "Hard", "Expert", "Expert+"];

const modifiers = [
  "No Fail", "Insta Fail", "Ghost Notes",
  "Faster Song", "Disappearing Arrows",
  "No Bombs", "Pro Mode", "Super Fast Song"
];

const reels = {
  map: document.getElementById('map'),
  difficulty: document.getElementById('difficulty'),
  modifier: document.getElementById('modifier'),
};

const spinButton = document.getElementById('spinButton');
const resultText = document.getElementById('result');

spinButton.addEventListener('click', () => {
  spinButton.disabled = true;
  resultText.textContent = "Spinning... 🎲";

  let spinDuration = 2000;

  const spinInterval = setInterval(() => {
    reels.map.textContent = maps[Math.floor(Math.random() * maps.length)];
    reels.difficulty.textContent = difficulties[Math.floor(Math.random() * difficulties.length)];
    reels.modifier.textContent = modifiers[Math.floor(Math.random() * modifiers.length)];
  }, 100);

  setTimeout(() => {
    clearInterval(spinInterval);

    const finalMap = maps[Math.floor(Math.random() * maps.length)];
    const finalDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    const finalMods = [];

    const modCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < modCount; i++) {
      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      if (!finalMods.includes(mod)) finalMods.push(mod);
    }

    reels.map.textContent = finalMap;
    reels.difficulty.textContent = finalDiff;
    reels.modifier.textContent = finalMods.join(", ");

    resultText.textContent = `🧠 Result: ${finalMap} | ${finalDiff} | ${finalMods.join(", ")}`;
    spinButton.disabled = false;
  }, spinDuration);
});

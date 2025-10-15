const maps = [
  "Escape (OST 1)", "Unlimited Power", "Crab Rave",
  "POP/STARS – K/DA", "Spooky Beats DLC", "Angel Voices",
  "100$ Bills", "Origins (Camellia)", "Spin Eternally"
];

const difficulties = ["Easy", "Normal", "Hard", "Expert", "Expert+"];
const modifiers = [
  "No Fail", "Insta Fail", "Ghost Notes", "Faster Song",
  "Disappearing Arrows", "No Bombs", "Pro Mode", "Super Fast Song"
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

  let spinDuration = 2500;

  // create animation spans for scroll effect
  Object.values(reels).forEach(reel => {
    reel.innerHTML = "";
    const list = document.createElement("div");
    list.classList.add("scroll-list");
    const items = [];
    for (let i = 0; i < 10; i++) {
      const text = document.createElement("span");
      text.textContent = randomItem(reel.id);
      list.appendChild(text);
      items.push(text);
    }
    reel.appendChild(list);
    list.style.animation = `spinReel ${spinDuration / 1000}s ease-in-out infinite`;
  });

  setTimeout(() => {
    Object.values(reels).forEach(r => r.innerHTML = "");
    const finalMap = randomItem('map');
    const finalDiff = randomItem('difficulty');
    const finalMods = getRandomModifiers();

    reels.map.textContent = finalMap;
    reels.difficulty.textContent = finalDiff;
    reels.modifier.textContent = finalMods.join(", ");
    resultText.textContent = `🧠 ${finalMap} | ${finalDiff} | ${finalMods.join(", ")}`;
    spinButton.disabled = false;
  }, spinDuration);
});

function randomItem(type) {
  if (type === 'map') return maps[Math.floor(Math.random() * maps.length)];
  if (type === 'difficulty') return difficulties[Math.floor(Math.random() * difficulties.length)];
  return modifiers[Math.floor(Math.random() * modifiers.length)];
}

function getRandomModifiers() {
  const finalMods = [];
  const modCount = Math.floor(Math.random() * 3) + 1;
  while (finalMods.length < modCount) {
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    if (!finalMods.includes(mod)) finalMods.push(mod);
  }
  return finalMods;
}

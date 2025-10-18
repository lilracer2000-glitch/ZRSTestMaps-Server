async function loadData() {
  const [courses, modes, difficulties] = await Promise.all([
    fetch('data/wamg-courses.json').then(r => r.json()),
    fetch('data/wamg-modes.json').then(r => r.json()),
    fetch('data/wamg-difficulty.json').then(r => r.json())
  ]);
  return { courses, modes, difficulties };
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showBonus(line) {
  const bonus = document.getElementById('bonus-text');
  bonus.textContent = line;
}

function spinWheel(id) {
  const el = document.getElementById(id);
  el.classList.remove('spin');
  void el.offsetWidth; // trigger reflow
  el.classList.add('spin');
}

async function init() {
  const { courses, modes, difficulties } = await loadData();

  document.getElementById('spin-btn').addEventListener('click', () => {
    // spin animation
    ['course-wheel', 'difficulty-wheel', 'mode-wheel'].forEach(spinWheel);

    setTimeout(() => {
      const course = randomItem(courses);
      const diff = randomItem(difficulties);
      const mode = randomItem(modes);

      document.getElementById('course-result').textContent = `🏝️ Course: ${course}`;
      document.getElementById('difficulty-result').textContent = `💪 Difficulty: ${diff}`;
      document.getElementById('mode-result').textContent = `🎯 Mode: ${mode}`;

      // 25% chance for a bonus line
      const bonusLines = [
        "💥 Optional Bank Shot Required for Extra Fun!",
        "🏦 Try a sneaky bank shot — double the bragging rights!",
        "🎯 Bonus Challenge: Bank it or bust!",
        "😎 Bank shot optional… but highly encouraged."
      ];
      document.getElementById('bonus-text').textContent = "";
      if (Math.random() < 0.25) {
        showBonus(randomItem(bonusLines));
      }
    }, 2100);
  });
}

init();

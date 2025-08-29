import assert from 'node:assert/strict';

const CONFIG = { baseSpawnInterval: 1.6, difficultyPerDay: { hp: 1.18, speed: 1.10, dmg: 1.12, spawnRate: 1.14 } };

function difficultyForDay(day, isBoss=false){
  const m = CONFIG.difficultyPerDay, n = day - 1;
  const scale = {
    hp: Math.pow(m.hp, n),
    speed: Math.pow(m.speed, n),
    dmg: Math.pow(m.dmg, n),
    spawnInterval: CONFIG.baseSpawnInterval / Math.pow(m.spawnRate, n)
  };
  if (isBoss){
    const bossFactor = Math.pow(1.2, n);
    scale.hp *= bossFactor;
    scale.dmg *= bossFactor;
  }
  return scale;
}

const d3Boss = difficultyForDay(3, true);
const d3 = difficultyForDay(3);
assert(d3Boss.hp > d3.hp);
assert(d3Boss.dmg > d3.dmg);

const d5Boss = difficultyForDay(5, true);
const d5 = difficultyForDay(5);
const ratio3 = d3Boss.hp / d3.hp;
const ratio5 = d5Boss.hp / d5.hp;
assert(ratio5 > ratio3);

console.log('Boss difficulty scaling test passed');

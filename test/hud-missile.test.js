import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.ok(
  html.includes('Missile Lvl <b id="misslvl">0</b>'),
  'HUD should display missile level',
);

console.log('HUD missile test passed');


import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.ok(
  html.includes('Shotgun Lvl <b id="shotlvl">1</b>'),
  'HUD should display shotgun level'
);

console.log('HUD shotgun test passed');


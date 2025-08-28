import assert from 'assert';
import { backgroundForEnv } from '../scenery.js';

assert.strictEqual(backgroundForEnv('land'), '#002b11');
assert.strictEqual(backgroundForEnv('water'), '#001a33');
assert.strictEqual(backgroundForEnv('transition'), '#704214');
console.log('backgroundForEnv returns expected colors');

const test = require('node:test');
const assert = require('node:assert/strict');
const { MAZO, FUERZA_MAX } = require('../js/mazo.js');

test('la tabla del nivel 0: 14 escalones con la cantidad de cartas correcta', () => {
  const tamanos = [];
  for (let f = FUERZA_MAX; f >= 1; f--) tamanos.push(MAZO.filter(c => c.f === f).length);
  assert.deepEqual(tamanos, [1, 1, 1, 1, 4, 4, 2, 4, 4, 4, 2, 4, 4, 4]);
});

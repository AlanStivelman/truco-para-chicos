// Las frases: que existan todas las que pide la pantalla y que ya no nombren al zorro ni al carpincho.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(raiz, 'js/frases.js'), 'utf8') + '\nthis.FRASES = FRASES;', ctx);
const FRASES = ctx.FRASES;
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');

test('ninguna frase nombra al zorro ni al carpincho', () => {
  for (const [id, texto] of Object.entries(FRASES)) {
    assert.doesNotMatch(id, /zorro|carpincho/i, id);
    assert.doesNotMatch(texto, /zorro|carpincho/i, id);
  }
});

test('existen las frases que la pantalla arma con partes', () => {
  const ids = [];
  for (const c of ['truco', 'retruco', 'vale-cuatro', 'envido', 'real-envido', 'quiero', 'no-quiero']) ids.push('capi-' + c, 'yo-' + c);
  for (const n of [1, 2, 3, 4, 5, 7]) ids.push('capi-gano-' + n, 'ganaste-' + n);
  for (const n of [2, 3, 4, 5, 7]) ids.push('si-quiero-envido-' + n);
  for (const n of [1, 2, 4]) ids.push('si-no-quiero-' + n);
  for (const n of [2, 3, 4]) ids.push('vale-' + n);
  for (const n of [1, 2, 3]) ids.push('estrellas-' + n);
  for (let f = 1; f <= 14; f++) ids.push('tabla-' + f);
  for (const p of ['espada', 'basto', 'oro', 'copa']) ids.push('palo-' + p);
  for (const id of ids) assert.ok(FRASES[id], id);
});

// Todo texto entre comillas de app.js con forma de id es una frase, salvo estos, que son de pantalla.
const DE_PANTALLA = new Set([
  // estado, clases y atributos
  'truco-progreso', 'hablando', 'activa', 'niveles', 'juego', 'fin', 'button', 'div', 'role', 'aria-label',
  'nivel', 'si', 'duelo', 'practica', 'tabla', 'visible', 'hidden', 'mio', 'suyo', 'tocado', 'sugerida', 'escalon',
  'destapado', 'sin-fuerza', 'pierde', 'brilla', 'muestra', 'elegida', 'fuerte', 'yo', 'zorro',
  // íconos, eventos del navegador y el partido libre
  'libro', 'dos', 'tres', 'megafono', 'trofeo', 'play', 'reloj', 'candado', 'casa', 'mapa', 'tilde', 'cruz',
  'click', 'pointerdown', 'resize', 'actual', 'libre',
  // sonidos
  'carta', 'bien', 'estrella',
  // acciones y eventos del motor, y palos
  'truco', 'retruco', 'vale-cuatro', 'envido', 'real-envido', 'quiero', 'no-quiero', 'mazo',
  'baza', 'canto', 'respuesta', 'truco-en-espera', 'puntos', 'fin-partida', 'jugando',
  'copa', 'espada', 'oro', 'basto',
]);
test('cada id de frase que usa la pantalla existe', () => {
  const literales = new Set([...app.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)*)'/g)].map(m => m[1]));
  const faltan = [...literales].filter(l => !FRASES[l] && !DE_PANTALLA.has(l));
  // Los prefijos de los ids armados con partes ('capi-', 'tabla-'...) no matchean porque terminan en guion.
  assert.deepEqual(faltan, []);
});

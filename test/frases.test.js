// Las frases: que existan todas las que pide la pantalla y que ya no nombren al zorro ni al carpincho.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { MAZO } = require('../js/mazo.js');

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

// Los ids que la pantalla arma con partes ('capi-' + canto, 'tabla-' + fuerza...), con todos los
// valores que pueden tomar.
const ARMADAS = [];
for (const c of ['truco', 'retruco', 'vale-cuatro', 'envido', 'real-envido', 'quiero', 'no-quiero']) ARMADAS.push('capi-' + c, 'yo-' + c);
for (const n of [1, 2, 3, 4, 5, 7]) ARMADAS.push('capi-gano-' + n, 'ganaste-' + n);
for (const n of [2, 3, 4, 5, 7]) ARMADAS.push('si-quiero-envido-' + n);
for (const n of [1, 2, 4]) ARMADAS.push('si-no-quiero-' + n);
for (const n of [2, 3, 4]) ARMADAS.push('vale-' + n);
for (const n of [1, 2, 3]) ARMADAS.push('estrellas-' + n);
for (let f = 1; f <= 14; f++) ARMADAS.push('tabla-' + f);
for (const p of ['espada', 'basto', 'oro', 'copa']) ARMADAS.push('palo-' + p);
// Los números de los tantos (0 a 7 y 20 a 33) y los nombres de las 40 cartas.
const NUMEROS = Array.from({ length: 34 }, (_, n) => n).filter(n => n <= 7 || n >= 20).map(n => 'num-' + n);
const CARTAS = MAZO.map(c => c.id);

test('existen las frases que la pantalla arma con partes', () => {
  for (const id of [...ARMADAS, ...NUMEROS, ...CARTAS]) assert.ok(FRASES[id], id);
});

// Todo texto entre comillas de app.js con forma de id es una frase, salvo estos, que son de pantalla.
const DE_PANTALLA = new Set([
  // estado, clases y atributos
  'truco-progreso', 'hablando', 'activa', 'niveles', 'juego', 'fin', 'button', 'div', 'role', 'aria-label',
  'nivel', 'si', 'duelo', 'practica', 'tabla', 'visible', 'hidden', 'mio', 'suyo', 'tocado', 'sugerida', 'escalon',
  'destapado', 'sin-fuerza', 'pierde', 'brilla', 'muestra', 'elegida', 'fuerte', 'yo', 'zorro',
  'toca', 'llena', 'flecha', 'igual', 'con-carta',
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

// Una frase que nadie dice sobra: o quedó vieja o falta usarla. Un literal que es a la vez frase y
// clase (como 'parda') cuenta como uso, así que esta prueba no ve todos los casos.
test('no sobra ninguna frase', () => {
  const literales = new Set([...app.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)*)'/g)].map(m => m[1]));
  const usadas = new Set([...literales, ...ARMADAS, ...NUMEROS, ...CARTAS]);
  const sobran = Object.keys(FRASES).filter(id => !usadas.has(id));
  assert.deepEqual(sobran, []);
});

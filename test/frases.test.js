// Las frases: que no falte ninguna de las que usa el juego, que no sobre ninguna y que
// ninguna nombre a los personajes viejos. Un id que falta se leería en voz alta como "undefined".
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Motor = require('../js/motor.js');

const raiz = path.join(__dirname, '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');
const ctx = {};
vm.runInNewContext(leer('js/frases.js') + '\nthis.FRASES = FRASES;', ctx);
const FRASES = ctx.FRASES;
const app = leer('js/app.js');
const literales = new Set([...app.matchAll(/'([a-z0-9][a-z0-9-]*)'/g)].map(m => m[1]));

// Frases que se arman sumando un pedazo: cada prefijo con todos los valores que puede tomar.
const CANTOS = ['truco', 'retruco', 'vale-cuatro', 'envido', 'real-envido', 'quiero', 'no-quiero'];
const SECUENCIAS_ENVIDO = [['envido'], ['real-envido'], ['envido', 'envido'], ['envido', 'real-envido'], ['envido', 'envido', 'real-envido']];
const enJuego = s => s.reduce((t, c) => t + Motor.VALOR_ENVIDO[c], 0);
const noQuerido = s => (s.length === 1 ? 1 : enJuego(s.slice(0, -1)));
const PUNTOS = [1, 2, 3, 4, ...SECUENCIAS_ENVIDO.map(enJuego), ...SECUENCIAS_ENVIDO.map(noQuerido)];
const ARMADAS = [
  ...['espada', 'basto', 'oro', 'copa'].map(p => 'palo-' + p),
  ...Array.from({ length: 14 }, (_, i) => 'tabla-' + (i + 1)),
  ...CANTOS.map(c => 'yo-' + c),
  ...CANTOS.map(c => 'capi-' + c),
  ...SECUENCIAS_ENVIDO.map(s => 'si-quiero-envido-' + enJuego(s)),
  ...SECUENCIAS_ENVIDO.map(s => 'si-no-quiero-capi-' + noQuerido(s)),
  ...[2, 3, 4].map(n => 'vale-' + n),
  ...PUNTOS.flatMap(n => ['ganaste-' + n, 'capi-gano-' + n]),
  ...[1, 2, 3].map(n => 'estrellas-' + n),
];
// Palabras del motor y de la pantalla que tienen guion pero no son frases.
const NO_SON_FRASES = new Set([...CANTOS, 'fin-partida', 'truco-en-espera', 'con-fuerza', 'btn-ayuda', 'btn-aprender', 'btn-inicio', 'btn-casa', 'btn-otra', 'btn-fin-niveles', 'cuenta-estrellas', 'fin-titulo', 'fin-globo', 'globo-toca', 'p-niveles', 'p-juego', 'truco-progreso', 'capi', 'yo', 'carta', 'fuerte', 'mazo', 'sugerida']);

test('toda frase armada existe', () => {
  for (const id of ARMADAS) assert.ok(FRASES[id] !== undefined, `falta la frase ${id}`);
});

// Los ids que se dicen: los literales dentro de cada Voz.decir(...) y los de las líneas que arman
// frases para decir después (pistas, arreglos de frases, intros). Los que terminan en guion son
// prefijos que se completan con datos: esos los cubre la prueba anterior.
function idsDichos(codigo) {
  const ids = new Set();
  const agregar = texto => {
    for (const m of texto.matchAll(/'([a-z0-9][a-z0-9-]*)'(?!\s*:)/g)) if (!m[1].endsWith('-')) ids.add(m[1]);
  };
  for (let i = codigo.indexOf('Voz.decir('); i >= 0; i = codigo.indexOf('Voz.decir(', i + 1)) {
    let nivel = 0, j = i + 'Voz.decir'.length;
    do { if (codigo[j] === '(') nivel++; else if (codigo[j] === ')') nivel--; j++; } while (nivel > 0);
    agregar(codigo.slice(i, j));
  }
  for (const linea of codigo.split('\n')) {
    if (/pista|frases|deCapi|intro:|return \[|\.push\(/.test(linea)) agregar(linea);
  }
  return ids;
}

test('todo id de frase que dice app.js existe', () => {
  const dichos = idsDichos(app);
  assert.ok(dichos.size > 40, 'la prueba tiene que encontrar las frases de app.js');
  for (const id of dichos) {
    if (NO_SON_FRASES.has(id)) continue;
    assert.ok(FRASES[id] !== undefined, `app.js usa la frase ${id}, que no existe`);
  }
});

test('no sobran frases', () => {
  const usadas = new Set([...literales, ...ARMADAS]);
  for (const id of Object.keys(FRASES)) {
    if (/^(num-\d+|c-\d+-\w+)$/.test(id)) continue; // números y nombres de cartas: se arman con datos
    assert.ok(usadas.has(id), `la frase ${id} no se usa`);
  }
});

test('ninguna frase nombra al zorro ni al carpincho', () => {
  for (const [id, texto] of Object.entries(FRASES)) {
    assert.ok(!/zorro|carpincho/i.test(texto), `la frase ${id} nombra a un personaje viejo`);
  }
});

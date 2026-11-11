// Herramientas de audio de la pantalla de grabar y de la voz.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const A = require('../js/audio-util.js');
const FRASES = require('../js/frases.js');

// Una toma de prueba: silencio, un tono de medio segundo y silencio.
function tomaDePrueba(tasa, { volumen = 0.3, golpe = false } = {}) {
  const m = new Float32Array(tasa * 2);
  for (let i = 0; i < tasa / 2; i++) m[Math.floor(tasa * 0.7) + i] = volumen * Math.sin((2 * Math.PI * 220 * i) / tasa);
  if (golpe) for (let i = 0; i < tasa * 0.05; i++) m[i] = 0.8; // el dedo al tocar el botón
  return m;
}

test('la toma se recorta con margen, sin el golpe del dedo, y queda con el volumen parejo', () => {
  const tasa = A.TASA;
  const { muestras, aviso } = A.prepararToma(tomaDePrueba(tasa, { golpe: true }), tasa);
  assert.equal(aviso, null);
  const seg = muestras.length / tasa;
  // medio segundo de voz + 80 ms antes + 150 ms después (más o menos una ventana de 10 ms)
  assert.ok(seg > 0.7 && seg < 0.76, `dura ${seg}`);
  const pico = Math.max(...muestras.map(Math.abs));
  assert.ok(Math.abs(pico - 0.9) < 0.01, `pico ${pico}`);
  assert.equal(muestras[0], 0); // fundido: empieza en cero, sin clic
  assert.ok(Math.abs(muestras[muestras.length - 1]) < 1e-6);
});

test('una toma sin voz se avisa y una que satura también', () => {
  assert.equal(A.prepararToma(new Float32Array(A.TASA), A.TASA).aviso, 'vacia');
  const fuerte = tomaDePrueba(A.TASA, { volumen: 1.6 }).map(x => Math.max(-1, Math.min(1, x)));
  assert.equal(A.prepararToma(fuerte, A.TASA).aviso, 'satura');
});

test('remuestrear de 48000 a 22050 conserva la duración', () => {
  const m = new Float32Array(48000).fill(0.5);
  const r = A.remuestrear(m, 48000, 22050);
  assert.equal(r.length, 22050);
  assert.ok(Math.abs(r[100] - 0.5) < 1e-6);
  assert.equal(A.remuestrear(m, 22050, 22050).length, 48000);
});

test('el WAV tiene la cabecera correcta', () => {
  const w = A.aWav(new Float32Array([0, 1, -1]), 22050);
  const d = new DataView(w.buffer);
  assert.equal(Buffer.from(w.slice(0, 4)).toString(), 'RIFF');
  assert.equal(Buffer.from(w.slice(8, 12)).toString(), 'WAVE');
  assert.equal(d.getUint32(24, true), 22050);
  assert.equal(d.getUint32(40, true), 6);
  assert.equal(w.length, 50);
  assert.equal(d.getInt16(46, true), 32767);
  assert.equal(d.getInt16(48, true), -32768);
});

test('crc32 da el valor conocido', () => {
  assert.equal(A.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('el zip se puede abrir con unzip', t => {
  try { execFileSync('unzip', ['-v'], { stdio: 'ignore' }); } catch (e) { t.skip('no hay unzip'); return; }
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'zip-'));
  const zip = A.armarZip([
    { nombre: 'audio/hola.wav', bytes: A.aWav(new Float32Array(10), 22050) },
    { nombre: 'audio/manifest.json', bytes: new TextEncoder().encode('{"hola":{"archivo":"hola.wav"}}') },
  ]);
  fs.writeFileSync(path.join(dir, 'a.zip'), zip);
  execFileSync('unzip', ['-t', path.join(dir, 'a.zip')]); // tira error si el zip está mal
  execFileSync('unzip', ['-q', path.join(dir, 'a.zip'), '-d', dir]);
  assert.equal(fs.readFileSync(path.join(dir, 'audio/manifest.json'), 'utf8'), '{"hola":{"archivo":"hola.wav"}}');
});

test('el manifiesto acepta el formato viejo (lista de ids) y el nuevo', () => {
  assert.deepEqual([...A.leerManifiesto(['hola'])], [['hola', { archivo: 'hola.mp3', huella: null }]]);
  assert.deepEqual([...A.leerManifiesto({ hola: { archivo: 'hola.wav', huella: 'x' } })], [['hola', { archivo: 'hola.wav', huella: 'x' }]]);
  assert.equal(A.leerManifiesto(null).size, 0);
});

test('la huella cambia si cambia el texto', () => {
  assert.equal(A.huella('¡Hola!'), A.huella('¡Hola!'));
  assert.notEqual(A.huella('¡Hola!'), A.huella('¡Hola'));
});

test('cada frase está en un solo grupo de grabación, y ninguna cae en "otras"', () => {
  const grupos = A.agrupar(FRASES);
  const todos = grupos.flatMap(g => g.ids);
  assert.equal(todos.length, Object.keys(FRASES).length);
  assert.equal(new Set(todos).size, todos.length);
  assert.ok(!grupos.some(g => g.id === 'otras'), 'frases sin grupo: ' + (grupos.find(g => g.id === 'otras') || { ids: [] }).ids.join(', '));
});

test('cada grabación del repo es de una frase que existe, con su archivo y el texto al día', () => {
  const manif = A.leerManifiesto(JSON.parse(fs.readFileSync(path.join(__dirname, '../audio/manifest.json'), 'utf8')));
  for (const [id, m] of manif) {
    assert.ok(FRASES[id], `${id} no es una frase`);
    assert.ok(fs.existsSync(path.join(__dirname, '../audio', m.archivo)), `falta audio/${m.archivo}`);
    if (m.huella !== null) assert.equal(m.huella, A.huella(FRASES[id]), `cambió el texto de ${id}: hay que regrabarla`);
  }
});

test('pausas: cortas entre partes de una cuenta, largas entre oraciones', () => {
  assert.ok(A.pausaEntre('veinte', 'mas') < A.pausaEntre('muy-bien', 'otra-ronda'));
  assert.ok(A.pausaEntre('capi-jugo', 'c-1-espada') < 0.2);
});

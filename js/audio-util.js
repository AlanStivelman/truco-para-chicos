// Herramientas de audio sin pantalla: preparar una toma grabada, armar WAV y ZIP, y ordenar las
// frases para grabarlas. Las usan la pantalla de grabar y la voz del juego. Se prueban con Node.
const AudioUtil = (() => {
  const TASA = 22050; // muestras por segundo de las tomas guardadas (mono)

  // Huella corta del texto de una frase: si el texto cambia, la toma vieja ya no sirve.
  function huella(texto) {
    let h = 0x811c9dc5;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  // Remuestreo lineal, promediando cuando se baja la tasa para no ensuciar el sonido.
  function remuestrear(muestras, desde, hasta) {
    if (desde === hasta) return Float32Array.from(muestras);
    const paso = desde / hasta;
    const largo = Math.round(muestras.length / paso);
    const salida = new Float32Array(largo);
    const ventana = Math.max(1, Math.floor(paso));
    for (let i = 0; i < largo; i++) {
      const centro = i * paso;
      if (ventana > 1) {
        const ini = Math.floor(centro);
        let s = 0, n = 0;
        for (let k = ini; k < ini + ventana && k < muestras.length; k++) { s += muestras[k]; n++; }
        salida[i] = n ? s / n : 0;
      } else {
        const a = Math.floor(centro), f = centro - a;
        const x0 = muestras[a] || 0, x1 = muestras[a + 1] !== undefined ? muestras[a + 1] : x0;
        salida[i] = x0 + (x1 - x0) * f;
      }
    }
    return salida;
  }

  // Prepara una toma: saca el golpe del dedo de las puntas, recorta el silencio dejando margen,
  // iguala el volumen y suaviza el principio y el final para que no haya clics al pegar frases.
  // Devuelve { muestras, aviso } con aviso 'vacia', 'satura' o null.
  function prepararToma(crudas, tasa) {
    const ms = n => Math.round((n / 1000) * tasa);
    const satura = crudas.reduce((c, x) => c + (Math.abs(x) >= 0.99 ? 1 : 0), 0) > crudas.length * 0.002;
    let m = crudas.subarray(Math.min(ms(150), crudas.length), Math.max(0, crudas.length - ms(150)));
    // Energía en ventanas de 10 ms; el umbral depende de lo más fuerte de la toma.
    const v = ms(10) || 1;
    const energias = [];
    for (let i = 0; i < m.length; i += v) {
      let s = 0;
      const fin = Math.min(i + v, m.length);
      for (let k = i; k < fin; k++) s += m[k] * m[k];
      energias.push(Math.sqrt(s / (fin - i)));
    }
    let maxima = 0;
    for (const e of energias) if (e > maxima) maxima = e;
    if (maxima < 0.01) return { muestras: new Float32Array(0), aviso: 'vacia' };
    const umbral = Math.max(maxima * 0.08, 0.004);
    const primera = energias.findIndex(e => e >= umbral);
    let ultima = energias.length - 1;
    while (ultima > 0 && energias[ultima] < umbral) ultima--;
    const ini = Math.max(0, primera * v - ms(80));
    const fin = Math.min(m.length, (ultima + 1) * v + ms(150));
    m = Float32Array.from(m.subarray(ini, fin));
    // Volumen parejo: el pico queda en 0,9.
    let pico = 0;
    for (const x of m) pico = Math.max(pico, Math.abs(x));
    const g = pico > 0 ? 0.9 / pico : 1;
    const fundido = Math.min(ms(8), Math.floor(m.length / 2));
    for (let i = 0; i < m.length; i++) {
      let f = 1;
      if (i < fundido) f = i / fundido;
      else if (i >= m.length - fundido) f = (m.length - 1 - i) / fundido;
      m[i] *= g * f;
    }
    return { muestras: m, aviso: satura ? 'satura' : null };
  }

  // WAV PCM de 16 bits, mono.
  function aWav(muestras, tasa) {
    const buf = new ArrayBuffer(44 + muestras.length * 2);
    const d = new DataView(buf);
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
    txt(0, 'RIFF'); d.setUint32(4, 36 + muestras.length * 2, true); txt(8, 'WAVE');
    txt(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, tasa, true); d.setUint32(28, tasa * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true);
    txt(36, 'data'); d.setUint32(40, muestras.length * 2, true);
    for (let i = 0; i < muestras.length; i++) {
      const x = Math.max(-1, Math.min(1, muestras[i]));
      d.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    return new Uint8Array(buf);
  }

  const TABLA_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // ZIP sin compresión. archivos: [{ nombre, bytes: Uint8Array }]. Devuelve Uint8Array.
  function armarZip(archivos, fecha = new Date()) {
    // Fecha en formato DOS (sin ella, algunos programas muestran 1980-00-00).
    const dia = ((Math.max(1980, fecha.getFullYear()) - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate();
    const hora = (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1);
    const enc = s => Uint8Array.from(unescape(encodeURIComponent(s)), ch => ch.charCodeAt(0));
    const partes = [], central = [];
    let offset = 0;
    for (const a of archivos) {
      const nombre = enc(a.nombre), crc = crc32(a.bytes), n = a.bytes.length;
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
      loc.setUint16(10, hora, true); loc.setUint16(12, dia, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, n, true); loc.setUint32(22, n, true);
      loc.setUint16(26, nombre.length, true);
      partes.push(new Uint8Array(loc.buffer), nombre, a.bytes);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true); cen.setUint16(12, hora, true); cen.setUint16(14, dia, true); cen.setUint32(16, crc, true); cen.setUint32(20, n, true);
      cen.setUint32(24, n, true); cen.setUint16(28, nombre.length, true); cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nombre);
      offset += 30 + nombre.length + n;
    }
    const largoCentral = central.reduce((s, p) => s + p.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, largoCentral, true); fin.setUint32(16, offset, true);
    const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
    const salida = new Uint8Array(todo.reduce((s, p) => s + p.length, 0));
    let o = 0;
    for (const p of todo) { salida.set(p, o); o += p.length; }
    return salida;
  }

  // audio/manifest.json: un array de ids (archivo <id>.mp3, formato viejo) o un objeto
  // { id: { archivo, huella } }. Devuelve un Map id -> { archivo, huella|null }.
  function leerManifiesto(json) {
    const m = new Map();
    if (Array.isArray(json)) json.forEach(id => m.set(id, { archivo: id + '.mp3', huella: null }));
    else if (json && typeof json === 'object') {
      for (const [id, v] of Object.entries(json)) if (v && v.archivo) m.set(id, { archivo: v.archivo, huella: v.huella || null });
    }
    return m;
  }

  // Grupos para grabar, en orden, con una nota de cómo decirlas. Cada frase cae en el primero que la acepta.
  const GRUPOS = [
    { id: 'inicio', nombre: 'Inicio y menú', tono: 'Alegre, como recibiendo a alguien.', es: id => ['inicio-capi', 'jugar-intro', 'camino-intro', 'elegi-nivel', 'nivel-empezar', 'nivel-bloqueado', 'nivel-en-obra'].includes(id) || id.startsWith('nivel-que-') },
    { id: 'n0', nombre: 'Nivel 0: conocer las cartas', tono: 'Contando un cuento, despacio.', es: id => id.startsWith('n0-') || id.startsWith('palo-') },
    { id: 'tabla', nombre: 'La tabla de cartas', tono: 'Despacio y claro: cada una se escucha sola.', es: id => id.startsWith('tabla-') },
    { id: 'cartas', nombre: 'Nombres de las cartas', tono: 'Seco, sin cantar y sin pausa: se pegan después de "Yo tiro" o "Gana".', es: id => id.startsWith('c-') },
    { id: 'numeros', nombre: 'Números', tono: 'Seco, sin cantar: se pegan unos con otros ("Veinte más 7 más 6 son 33").', es: id => id.startsWith('num-') || ['veinte', 'mas', 'son'].includes(id) },
    { id: 'n1', nombre: 'Qué carta gana', tono: 'Alegre. "Gana" y "La más fuerte es" se pegan al nombre de una carta: sin bajar el tono al final.', es: id => ['muy-bien', 'gana', 'casi', 'mas-fuerte-es'].includes(id) },
    { id: 'capi', nombre: 'Capi canta y contesta', tono: 'Fuerte y con gracia, como en la mesa.', es: id => id.startsWith('capi-') },
    { id: 'nene', nombre: 'Los botones del nene', tono: 'Fuerte, como si cantara él.', es: id => id.startsWith('yo-') },
    { id: 'pistas', nombre: 'Consejos de Capi', tono: 'Tranquilo, de consejo, en voz baja.', es: id => id.startsWith('pista-') || id === 'te-toca' },
    { id: 'puntos', nombre: 'Puntos', tono: 'Alegre si gana el nene; tranquilo si gana Capi.', es: id => /^(ganaste|vale|si-quiero-envido|si-no-quiero)-/.test(id) },
    { id: 'rondas', nombre: 'Rondas y partidas', tono: 'Alegre; cuando gana Capi, sin burlarse.', es: id => /^(n1|n2|n3|n4)-/.test(id) || /^(mano|ronda|partida|envido|sin-par|truco-espera)/.test(id) || ['parda', 'otra-ronda', 'figuras-cero', 'vos-tenes', 'son-buenas'].includes(id) },
    { id: 'fin', nombre: 'Final del nivel', tono: 'De festejo, pero tranquilo.', es: id => id.startsWith('estrellas-') || id.startsWith('fin-') },
    { id: 'otras', nombre: 'Otras frases', tono: 'Natural.', es: () => true },
  ];
  function agrupar(frases) {
    const grupos = GRUPOS.map(g => ({ id: g.id, nombre: g.nombre, tono: g.tono, ids: [] }));
    for (const id of Object.keys(frases)) grupos[GRUPOS.findIndex(g => g.es(id))].ids.push(id);
    return grupos.filter(g => g.ids.length);
  }

  // Pausa entre dos clips seguidos: corta entre las partes de una cuenta o de un nombre de carta,
  // más larga entre oraciones.
  const PIEZA = /^(num-|c-)|^(veinte|mas|son|gana|mas-fuerte-es|vos-tenes|capi-tengo|capi-jugo)$/;
  const pausaEntre = (a, b) => (PIEZA.test(a) || PIEZA.test(b) ? 0.12 : 0.35);

  return { TASA, huella, remuestrear, prepararToma, aWav, crc32, armarZip, leerManifiesto, agrupar, pausaEntre };
})();

if (typeof module !== 'undefined') module.exports = AudioUtil;

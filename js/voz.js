// Voz y sonidos. Voz.decir('id', 'id', ...) dice las frases en orden y
// devuelve una promesa que termina cuando terminó de hablar.
const Voz = (() => {
  const mudo = new URLSearchParams(location.search).has('silencio');
  const tts = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let turno = 0;
  let audioActual = null;
  let finAudio = null; // termina la promesa del audio en curso si se lo corta
  let grabadas = new Set();
  let alHablar = () => {};
  let ctx = null;

  fetch('audio/manifest.json').then(r => r.json()).then(l => { grabadas = new Set(l); }).catch(() => {});

  function elegirVoz() {
    const voces = tts.getVoices().filter(v => v.lang.toLowerCase().startsWith('es'));
    for (const pref of ['es-ar', 'es-419', 'es-us', 'es-mx']) {
      const v = voces.find(x => x.lang.toLowerCase().replace('_', '-') === pref);
      if (v) return v;
    }
    return voces[0] || null;
  }

  function parar() {
    turno++;
    if (tts) tts.cancel();
    if (audioActual) { audioActual.pause(); audioActual = null; }
    if (finAudio) { const f = finAudio; finAudio = null; f(); }
  }

  function leer(texto) {
    return new Promise(fin => {
      if (!tts) return setTimeout(fin, 600);
      const u = new SpeechSynthesisUtterance(texto);
      const v = elegirVoz();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'es-AR';
      u.rate = 0.9;
      u.pitch = 1.1;
      // Algunos navegadores no avisan cuando terminan: red de seguridad.
      const limite = setTimeout(fin, 2000 + texto.length * 110);
      u.onend = u.onerror = () => { clearTimeout(limite); fin(); };
      tts.speak(u);
    });
  }

  function reproducir(id) {
    return new Promise(fin => {
      const a = new Audio(`audio/${id}.mp3`);
      audioActual = a;
      // pause() no dispara onended: por eso parar() llama a finAudio.
      const listo = () => { if (finAudio === listo) finAudio = null; fin(); };
      finAudio = listo;
      a.onended = a.onerror = listo;
      a.play().catch(listo);
    });
  }

  async function decir(...ids) {
    parar();
    const mio = turno;
    // Un id que no existe se leería como "undefined": se avisa (también con ?silencio) y se saltea.
    const faltan = ids.filter(id => FRASES[id] === undefined);
    if (faltan.length) console.error('Frases inexistentes:', faltan.join(', '));
    if (mudo) return new Promise(r => setTimeout(r, 30));
    // Las frases seguidas sin grabación se leen juntas para que suene natural.
    const partes = [];
    for (const id of ids.filter(x => FRASES[x] !== undefined)) {
      if (grabadas.has(id)) partes.push({ audio: id });
      else if (partes.length && partes[partes.length - 1].texto !== undefined) partes[partes.length - 1].texto += ' ' + FRASES[id];
      else partes.push({ texto: FRASES[id] });
    }
    alHablar(true);
    for (const p of partes) {
      if (mio !== turno) return;
      await (p.audio ? reproducir(p.audio) : leer(p.texto));
    }
    if (mio === turno) alHablar(false);
  }

  // Sonidos cortos y suaves, hechos con el sintetizador del navegador.
  function activar() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
    } catch (e) { /* sin sonido */ }
  }
  function nota(frec, cuando, dura) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = frec;
    g.gain.setValueAtTime(0.0001, cuando);
    g.gain.exponentialRampToValueAtTime(0.18, cuando + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + dura);
    o.connect(g).connect(ctx.destination);
    o.start(cuando);
    o.stop(cuando + dura + 0.05);
  }
  function sonido(tipo) {
    if (!ctx || mudo) return;
    const t = ctx.currentTime;
    if (tipo === 'bien') { nota(523, t, 0.18); nota(784, t + 0.12, 0.3); }
    if (tipo === 'casi') { nota(330, t, 0.3); }
    if (tipo === 'carta') { nota(440, t, 0.08); }
    if (tipo === 'estrella') { nota(523, t, 0.15); nota(659, t + 0.12, 0.15); nota(784, t + 0.24, 0.15); nota(1047, t + 0.36, 0.4); }
  }

  return { decir, parar, activar, sonido, alHablar: fn => { alHablar = fn; } };
})();

// Voz y sonidos. Voz.decir('id', 'id', ...) dice las frases en orden y
// devuelve una promesa que termina cuando terminó de hablar. Usa la grabación del papá
// si hay una para esa frase; si no, la voz del dispositivo.
const Voz = (() => {
  const mudo = new URLSearchParams(location.search).has('silencio');
  const tts = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let turno = 0;
  let fuenteActual = null; // el clip grabado que está sonando
  let finAudio = null;     // termina la promesa del clip en curso si se lo corta
  let alHablar = () => {};
  let ctx = null;

  // De dónde sale cada frase grabada: una toma de este navegador (la pantalla de grabar) o un
  // archivo del repo (audio/manifest.json). Si el texto de la frase cambió, la grabación no se usa.
  const fuentes = new Map(); // id -> { de: 'local' | 'repo', archivo }
  const vigente = (id, h) => !!FRASES[id] && (h === null || h === AudioUtil.huella(FRASES[id]));
  // Nada de esto puede trabar la voz: con tiempo límite, si no llega se sigue sin grabaciones.
  const conLimite = (p, seg, valor) => Promise.race([p, new Promise(r => setTimeout(() => r(valor), seg * 1000))]);
  let cargado = false;
  conLimite(Promise.all([
    fetch('audio/manifest.json').then(r => (r.ok ? r.json() : [])).then(AudioUtil.leerManifiesto).catch(() => new Map()),
    typeof Tomas !== 'undefined' ? Tomas.metas() : Promise.resolve(new Map()),
  ]).then(([repo, locales]) => {
    for (const [id, m] of repo) if (vigente(id, m.huella)) fuentes.set(id, { de: 'repo', archivo: m.archivo });
    for (const [id, m] of locales) if (m && m.huella && vigente(id, m.huella)) fuentes.set(id, { de: 'local' });
  }).catch(() => {}), 2).then(() => { cargado = true; });

  // Cada grabación se decodifica una sola vez. Si falla, esa frase la lee la voz del dispositivo.
  const memoria = new Map(); // id -> Promise<AudioBuffer|null>
  function decodificar(bytes) {
    return new Promise(ok => {
      try {
        const r = ctx.decodeAudioData(bytes.slice(0), ok, () => ok(null));
        if (r && r.catch) r.catch(() => {}); // algunos navegadores además devuelven una promesa
      } catch (e) { ok(null); }
    });
  }
  function grabacion(id) {
    if (!memoria.has(id)) {
      const f = fuentes.get(id);
      const p = conLimite((f.de === 'local' ? Tomas.audio(id) : fetch('audio/' + f.archivo).then(r => (r.ok ? r.arrayBuffer() : null)))
        .then(bytes => (bytes ? decodificar(bytes) : null))
        .catch(() => null), 3, null);
      p.then(b => { if (!b && memoria.get(id) === p) memoria.delete(id); }); // se reintenta la próxima vez
      memoria.set(id, p);
      // Decodificados ocupan mucho: se guardan los últimos 40.
      if (memoria.size > 40) memoria.delete(memoria.keys().next().value);
    } else {
      const p = memoria.get(id);
      memoria.delete(id);
      memoria.set(id, p); // queda como el más reciente
    }
    return memoria.get(id);
  }

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
    if (fuenteActual) {
      const f = fuenteActual;
      fuenteActual = null;
      f.onended = null;
      try { f.stop(); } catch (e) { /* ya había terminado */ }
    }
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

  // Devuelve una promesa con true si sonó, o false si no se pudo (y entonces la lee el dispositivo).
  function tocar(buf) {
    return new Promise(fin => {
      let s;
      try {
        s = ctx.createBufferSource();
        s.buffer = buf;
        s.connect(ctx.destination);
      } catch (e) { fin(false); return; }
      // stop() no siempre dispara onended: por eso parar() llama a finAudio.
      const listoClip = () => {
        clearTimeout(limite);
        if (finAudio === listoClip) finAudio = null;
        if (fuenteActual === s) fuenteActual = null;
        fin(true);
      };
      // Red de seguridad: si no avisa que terminó, se lo corta para que no se reanude encima de otra frase.
      const limite = setTimeout(() => {
        s.onended = null;
        try { s.stop(); } catch (e) { /* ya terminó */ }
        listoClip();
      }, buf.duration * 1000 + 1500);
      fuenteActual = s;
      finAudio = listoClip;
      s.onended = listoClip;
      try { s.start(); } catch (e) {
        clearTimeout(limite);
        if (finAudio === listoClip) finAudio = null;
        if (fuenteActual === s) fuenteActual = null;
        fin(false);
      }
    });
  }

  const pausa = seg => new Promise(r => setTimeout(r, seg * 1000));

  async function decir(...ids) {
    parar();
    const mio = turno;
    if (mudo) return new Promise(r => setTimeout(r, 30));
    alHablar(true);
    // Si no hay grabaciones para estas frases (o todavía no se sabe), se habla enseguida, sin
    // esperar nada: Safari solo deja hablar a la voz del dispositivo dentro del toque.
    if (!cargado || !ids.some(id => fuentes.has(id))) {
      await leer(ids.map(id => FRASES[id]).join(' '));
      if (mio === turno) alHablar(false);
      return;
    }
    // Primero se cargan todas las partes, para que no haya huecos desparejos entre palabras.
    if (ctx && ctx.state !== 'running') {
      // Justo después del toque que activa el audio, el contexto puede tardar un poco en arrancar.
      try { await Promise.race([ctx.resume(), pausa(0.3)]); } catch (e) { /* sigue con la voz del dispositivo */ }
      if (mio !== turno) return;
    }
    const conAudio = !!ctx && ctx.state === 'running';
    const bufs = await Promise.all(ids.map(id => (conAudio && fuentes.has(id) ? grabacion(id) : null)));
    if (mio !== turno) return;
    // Las frases seguidas sin grabación se leen juntas para que suene natural.
    const partes = [];
    ids.forEach((id, i) => {
      const ultima = partes[partes.length - 1];
      if (bufs[i]) partes.push({ buf: bufs[i], primera: id, ultima: id });
      else if (ultima && !ultima.buf) { ultima.texto += ' ' + FRASES[id]; ultima.ultima = id; }
      else partes.push({ texto: FRASES[id], primera: id, ultima: id });
    });
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) {
        await pausa(AudioUtil.pausaEntre(partes[i - 1].ultima, partes[i].primera));
        if (mio !== turno) return;
      }
      const p = partes[i];
      const sono = p.buf ? await tocar(p.buf) : (await leer(p.texto), true);
      if (mio !== turno) return;
      if (!sono) {
        await leer(FRASES[p.primera]);
        if (mio !== turno) return;
      }
    }
    alHablar(false);
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

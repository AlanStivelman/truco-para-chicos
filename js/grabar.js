// Pantalla para grabar las frases con la voz del papá. Graba el micrófono en crudo (sin
// MediaRecorder, para que ande igual en Safari), prepara la toma (recorte, volumen, fundidos),
// la guarda como WAV en este navegador y arma un .zip para subir al juego.
(() => {
  const $ = s => document.querySelector(s);
  const ICONOS = {
    microfono: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    parar: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
    escuchar: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5c1.5 1.5 1.5 5.5 0 7M19 6c3 3 3 9 0 12"/>',
    anterior: '<path d="M15 5 8 12l7 7"/>',
    siguiente: '<path d="M9 5l7 7-7 7"/>',
    tacho: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  };
  const icono = n => `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n]}</svg>`;
  $('#btn-anterior').innerHTML = icono('anterior');
  $('#btn-siguiente').innerHTML = icono('siguiente');
  $('#btn-escuchar').innerHTML = icono('escuchar');
  $('#btn-borrar').insertAdjacentHTML('afterbegin', icono('tacho'));

  const GRUPOS = AudioUtil.agrupar(FRASES);
  const ORDEN = GRUPOS.flatMap(g => g.ids);
  const grupoDe = id => GRUPOS.find(g => g.ids.includes(id));

  let metas = new Map();   // tomas de este navegador
  let repo = new Map();    // grabaciones ya subidas (audio/manifest.json)
  let actual = 0;          // índice en ORDEN
  // 'quieto' | 'abriendo' (pidiendo el micrófono) | 'grabando' | 'procesando'
  let estado = 'quieto';

  const vigente = (id, h) => h === AudioUtil.huella(FRASES[id]);
  // 'local' (grabada acá), 'repo' (ya subida), 'vieja' (cambió el texto) o 'falta'
  function situacion(id) {
    const m = metas.get(id);
    if (m && vigente(id, m.huella)) return 'local';
    const r = repo.get(id);
    if (r && (r.huella === null || vigente(id, r.huella))) return 'repo';
    if (m || r) return 'vieja';
    return 'falta';
  }
  const TEXTO_SITUACION = { local: 'Grabada', repo: 'Ya está en el juego', vieja: 'Cambió el texto: hay que regrabarla', falta: 'Falta grabar' };

  function mensaje(t) { $('#mensaje').textContent = t; }

  function pintar() {
    const id = ORDEN[actual];
    const g = grupoDe(id);
    $('#grupo').textContent = g.nombre;
    $('#tono').textContent = g.tono;
    $('#frase').textContent = FRASES[id];
    $('#id-frase').textContent = id;
    const s = situacion(id);
    $('#estado').textContent = TEXTO_SITUACION[s];
    $('#estado').className = 'g-estado ' + s;
    const ocupado = estado !== 'quieto';
    $('#btn-anterior').disabled = ocupado || actual === 0;
    $('#btn-siguiente').disabled = ocupado || actual === ORDEN.length - 1;
    $('#btn-falta').disabled = ocupado;
    $('#btn-escuchar').disabled = ocupado || !(s === 'local' || s === 'repo');
    $('#btn-grabar').disabled = estado === 'abriendo' || estado === 'procesando';
    $('#btn-grabar').classList.toggle('grabando', estado === 'grabando');
    $('#btn-grabar').innerHTML = icono(estado === 'grabando' ? 'parar' : 'microfono');
    $('#btn-grabar').setAttribute('aria-label', estado === 'grabando' ? 'Cortar la grabación' : 'Grabar');
    const hechas = ORDEN.filter(i => ['local', 'repo'].includes(situacion(i))).length;
    $('#progreso').textContent = `${hechas} de ${ORDEN.length}`;
    pintarLista(ocupado);
  }

  function pintarLista(ocupado) {
    const cont = $('#grupos');
    const abiertos = new Set([...cont.querySelectorAll('details[open]')].map(d => d.dataset.grupo));
    const actualId = ORDEN[actual];
    if (!abiertos.size) abiertos.add(grupoDe(actualId).id);
    cont.innerHTML = '';
    for (const g of GRUPOS) {
      const hechas = g.ids.filter(i => ['local', 'repo'].includes(situacion(i))).length;
      const d = document.createElement('details');
      d.dataset.grupo = g.id;
      d.open = abiertos.has(g.id);
      const aviso = hechas > 0 && hechas < g.ids.length ? ' <span class="g-incompleto">a medias</span>' : '';
      d.innerHTML = `<summary>${icono('siguiente').replace('class="icono"', 'class="g-flecha"')}<span>${g.nombre}</span> <span class="g-cuenta">${hechas} de ${g.ids.length}</span>${aviso}</summary>`;
      const ul = document.createElement('ul');
      for (const id of g.ids) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.className = 'g-item ' + situacion(id) + (id === actualId ? ' actual' : '');
        b.disabled = ocupado;
        b.innerHTML = `<span class="g-punto" aria-hidden="true"></span><span class="g-texto"></span>`;
        b.querySelector('.g-texto').textContent = FRASES[id];
        b.setAttribute('aria-label', `${FRASES[id]} (${TEXTO_SITUACION[situacion(id)]})`);
        b.onclick = () => { ir(ORDEN.indexOf(id)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        li.appendChild(b);
        ul.appendChild(li);
      }
      d.appendChild(ul);
      cont.appendChild(d);
    }
  }

  function ir(i) {
    if (estado !== 'quieto') return;
    actual = Math.max(0, Math.min(ORDEN.length - 1, i));
    mensaje('');
    pararEscucha();
    pintar();
  }

  // ---------- Audio ----------
  let ctx = null, microfono = null, nodo = null, entrada = null, trozos = [], idGrabando = null, sonando = null;

  function contexto() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume();
    return ctx;
  }

  // Algo salió mal en medio: se vuelve a 'quieto' para que nunca quede el botón trabado.
  function fallo(texto) {
    soltarMicrofono();
    estado = 'quieto';
    pintar();
    mensaje(texto);
  }

  // El micrófono se suelta después de cada toma: con él abierto, el iPhone reproduce bajito.
  function soltarMicrofono() {
    try { if (entrada) entrada.disconnect(); if (nodo) { nodo.disconnect(); nodo.onaudioprocess = null; } } catch (e) { /* ya estaba */ }
    entrada = nodo = null;
    if (microfono) microfono.getTracks().forEach(t => t.stop());
    microfono = null;
  }

  async function empezar() {
    estado = 'abriendo';
    idGrabando = ORDEN[actual]; // la toma queda fija a esta frase aunque algo cambie
    pararEscucha();
    pintar();
    try {
      contexto();
      microfono = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
    } catch (e) {
      fallo('No se pudo usar el micrófono. Revisá el permiso del navegador para esta página.');
      return;
    }
    try {
      trozos = [];
      entrada = ctx.createMediaStreamSource(microfono);
      nodo = ctx.createScriptProcessor(4096, 1, 1);
      nodo.onaudioprocess = ev => { trozos.push(Float32Array.from(ev.inputBuffer.getChannelData(0))); };
      entrada.connect(nodo);
      nodo.connect(ctx.destination); // Safari necesita que el nodo esté conectado para recibir audio
    } catch (e) {
      fallo('No se pudo empezar a grabar. Probá recargar la página.');
      return;
    }
    estado = 'grabando';
    pintar();
    mensaje('Grabando… decí la frase y tocá el botón para cortar.');
  }

  async function cortar() {
    estado = 'procesando';
    pintar();
    // Se sigue grabando un ratito, para no comerse el final de la última palabra.
    await new Promise(r => setTimeout(r, 300));
    const tasa = ctx.sampleRate;
    soltarMicrofono();
    const id = idGrabando;
    try {
      const largo = trozos.reduce((s, t) => s + t.length, 0);
      const crudas = new Float32Array(largo);
      let o = 0;
      for (const t of trozos) { crudas.set(t, o); o += t.length; }
      trozos = [];
      const muestras = AudioUtil.remuestrear(crudas, tasa, AudioUtil.TASA);
      const toma = AudioUtil.prepararToma(muestras, AudioUtil.TASA);
      if (toma.aviso === 'vacia') { fallo('No se escuchó nada. Acercate al micrófono y probá otra vez.'); return; }
      const wav = AudioUtil.aWav(toma.muestras, AudioUtil.TASA);
      const meta = { huella: AudioUtil.huella(FRASES[id]), fecha: Date.now(), segundos: toma.muestras.length / AudioUtil.TASA };
      try {
        await Tomas.guardar(id, wav.buffer, meta);
        metas.set(id, meta);
      } catch (e) {
        fallo('No se pudo guardar la toma en este navegador. ¿Está en modo privado?');
        return;
      }
      estado = 'quieto';
      pintar();
      mensaje(toma.aviso === 'satura'
        ? 'Guardada, pero sonó muy fuerte y se distorsiona. Probá otra vez un poco más lejos.'
        : 'Guardada. Escuchala; si te gusta, pasá a la siguiente.');
      escuchar(id).catch(() => {});
    } catch (e) {
      trozos = [];
      fallo('No se pudo preparar la toma. Probá otra vez.');
    }
  }

  let turnoEscucha = 0; // cada escucha nueva (o una grabación) cancela la anterior
  function pararEscucha() {
    turnoEscucha++;
    if (sonando) { try { sonando.stop(); } catch (e) { /* ya terminó */ } sonando = null; }
  }

  async function escuchar(id = ORDEN[actual]) {
    pararEscucha();
    const mio = turnoEscucha;
    const c = contexto();
    let bytes = null;
    if (situacion(id) === 'local') bytes = await Tomas.audio(id);
    else if (situacion(id) === 'repo') {
      try { const r = await fetch('audio/' + repo.get(id).archivo); bytes = r.ok ? await r.arrayBuffer() : null; } catch (e) { bytes = null; }
    }
    if (mio !== turnoEscucha) return;
    if (!bytes) { mensaje('No se pudo cargar esta grabación.'); return; }
    const r = c.decodeAudioData(bytes.slice(0), buf => {
      if (mio !== turnoEscucha || estado !== 'quieto') return; // mientras tanto se empezó a grabar
      const s = c.createBufferSource();
      s.buffer = buf;
      s.connect(c.destination);
      s.start();
      sonando = s;
    }, () => mensaje('No se pudo reproducir esta grabación.'));
    if (r && r.catch) r.catch(() => {});
  }

  // ---------- Descargar y borrar ----------
  async function descargar() {
    const boton = $('#btn-descargar');
    boton.disabled = true;
    mensaje('Armando el archivo…');
    try {
      const manifiesto = {};
      for (const [id, r] of repo) if (FRASES[id] && situacion(id) === 'repo') manifiesto[id] = { archivo: r.archivo, huella: r.huella || AudioUtil.huella(FRASES[id]) };
      const archivos = [];
      for (const id of ORDEN) {
        if (situacion(id) !== 'local') continue;
        const bytes = await Tomas.audio(id);
        if (!bytes) continue;
        archivos.push({ nombre: `audio/${id}.wav`, bytes: new Uint8Array(bytes) });
        manifiesto[id] = { archivo: id + '.wav', huella: metas.get(id).huella };
      }
      if (!archivos.length) { mensaje('Todavía no hay grabaciones nuevas en este aparato.'); return; }
      const json = JSON.stringify(manifiesto, null, 1);
      archivos.push({ nombre: 'audio/manifest.json', bytes: new TextEncoder().encode(json + '\n') });
      const zip = AudioUtil.armarZip(archivos);
      const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `grabaciones-truco-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      mensaje(`Listo: ${archivos.length - 1} grabaciones en el .zip.`);
    } catch (e) {
      mensaje('No se pudo armar el archivo.');
    } finally {
      boton.disabled = false;
    }
  }

  async function borrar() {
    if (estado !== 'quieto') return;
    if (!confirm('¿Borrar todas las grabaciones guardadas en este aparato? Las que ya subiste al juego no se borran.')) return;
    try { await Tomas.borrarTodo(); metas = new Map(); mensaje('Borradas.'); } catch (e) { mensaje('No se pudieron borrar.'); }
    pintar();
  }

  // ---------- Botones ----------
  $('#btn-grabar').onclick = () => { if (estado === 'quieto') empezar(); else if (estado === 'grabando') cortar(); };
  $('#btn-anterior').onclick = () => ir(actual - 1);
  $('#btn-siguiente').onclick = () => ir(actual + 1);
  $('#btn-escuchar').onclick = () => escuchar().catch(() => mensaje('No se pudo reproducir esta grabación.'));
  $('#btn-falta').onclick = () => {
    const desde = ORDEN.findIndex((id, i) => i > actual && !['local', 'repo'].includes(situacion(id)));
    const i = desde >= 0 ? desde : ORDEN.findIndex(id => !['local', 'repo'].includes(situacion(id)));
    if (i >= 0) ir(i); else mensaje('¡Ya están todas grabadas!');
  };
  $('#btn-descargar').onclick = descargar;
  $('#btn-borrar').onclick = borrar;
  document.addEventListener('keydown', e => {
    // Sobre un botón, la barra espaciadora ya lo toca el navegador.
    if (e.repeat || e.target.closest('button, summary, a') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.code === 'Space') { e.preventDefault(); $('#btn-grabar').click(); }
    else if (e.key === 'ArrowRight') ir(actual + 1);
    else if (e.key === 'ArrowLeft') ir(actual - 1);
  });

  // ---------- Arranque ----------
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* no importa */ }
  pintar();
  Promise.all([
    Tomas.metas(),
    fetch('audio/manifest.json').then(r => (r.ok ? r.json() : [])).then(AudioUtil.leerManifiesto).catch(() => new Map()),
  ]).then(([m, r]) => {
    metas = m;
    repo = r;
    const primera = ORDEN.findIndex(id => !['local', 'repo'].includes(situacion(id)));
    if (estado === 'quieto' && primera > 0) actual = primera;
    pintar();
  });
})();

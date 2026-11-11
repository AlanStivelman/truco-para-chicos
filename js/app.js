// Pantallas y niveles.
const $ = s => document.querySelector(s);
const espera = ms => new Promise(r => setTimeout(r, ms));

const NIVELES_LISTOS = 4; // el nivel 5 todavía no está hecho
// Nombres de los niveles: solo para el adulto que acompaña; la voz no los necesita.
const NOMBRE_NIVEL = ['Conocer las cartas', 'Qué carta gana', 'Mejor de tres', 'El truco', 'El envido', 'Partida a 15'];

let progreso = { estrellas: {} };
try { progreso = JSON.parse(localStorage.getItem('truco-progreso')) || progreso; } catch (e) { /* sin guardado */ }
function guardar() {
  try { localStorage.setItem('truco-progreso', JSON.stringify(progreso)); } catch (e) { /* sin guardado */ }
}

let partida = 0;          // cambia cada vez que se entra o sale de un nivel
let ayuda = () => {};     // qué pasa al tocar a Capi o el parlante
let nivelActual = 1;
let saludado = false;

Voz.alHablar(si => document.body.classList.toggle('hablando', si));

function mostrar(nombre) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === 'p-' + nombre));
}

// ---------- Íconos de los botones fijos ----------
$('#btn-aprender').innerHTML = SVG_LIBRO_ESTRELLA;
$('#btn-inicio').innerHTML = icono('casa');
$('#btn-casa').innerHTML = icono('mapa');
$('#btn-otra').innerHTML = icono('otra');
$('#btn-fin-niveles').innerHTML = icono('mapa', 2.6);
document.querySelectorAll('.btn-ayuda').forEach(b => { b.innerHTML = icono('parlante'); });

// ---------- Elegir nivel: el camino ----------
const estaAbierto = n => n === 0 || (progreso.estrellas[n - 1] || 0) >= 2 || (progreso.estrellas[n] || 0) > 0;

function iconoNivel(n) {
  if (n === 0) return SVG_LIBRO_ESTRELLA;
  if (n === 1) {
    // Dos cartas chiquitas: el siete de espada y el siete de oro.
    const a = crearCarta(MAZO.find(c => c.n === 7 && c.palo === 'espada'), { conFuerza: false });
    const b = crearCarta(MAZO.find(c => c.n === 7 && c.palo === 'oro'), { conFuerza: false });
    return `<span class="nivel-cartas" aria-hidden="true">${[a, b].map(x => x.outerHTML.replace(/^<button/, '<span').replace(/<\/button>$/, '</span>')).join('')}</span>`;
  }
  if (n === 2) {
    return '<svg class="nivel-bazas" viewBox="0 0 124 60" aria-hidden="true">' +
      '<circle cx="20" cy="30" r="17" fill="#FFFFFF" stroke="#1D3557" stroke-width="5"/>' +
      '<circle cx="62" cy="30" r="17" fill="#FFFFFF" stroke="#1D3557" stroke-width="5"/>' +
      '<circle cx="104" cy="30" r="17" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="6 5"/></svg>';
  }
  return icono(['', '', '', 'megafono', 'envido', 'trofeo'][n], 2.2);
}

function irANiveles() {
  partida++;
  mostrar('niveles');
  const total = Object.values(progreso.estrellas).reduce((s, x) => s + x, 0);
  $('#cuenta-estrellas').innerHTML = SVG_ESTRELLA + `<span>${total}</span>`;
  $('#cuenta-estrellas').setAttribute('aria-label', `${total} estrellas`);

  // El que toca: el primer nivel abierto y listo que todavía no tiene 2 estrellas.
  let toca = -1;
  for (let n = 0; n <= NIVELES_LISTOS; n++) {
    if (estaAbierto(n) && (progreso.estrellas[n] || 0) < 2) { toca = n; break; }
  }

  const camino = $('#camino');
  camino.innerHTML = '';
  for (let n = 0; n <= 5; n++) {
    const abierto = estaAbierto(n);
    const listo = n <= NIVELES_LISTOS;
    const ganadas = progreso.estrellas[n] || 0;
    const parada = document.createElement('div');
    parada.className = 'parada';
    parada.dataset.n = n;
    const b = document.createElement('button');
    b.className = 'btn nivel' + (!abierto ? ' cerrado' : !listo ? ' pronto' : n === toca ? ' toca' : '');
    b.setAttribute('aria-label', `Nivel ${n}: ${NOMBRE_NIVEL[n]}`);
    b.innerHTML = iconoNivel(n) + `<span class="nivel-num" aria-hidden="true">${n}</span>` +
      (!abierto ? `<span class="nivel-marca">${icono('candado')}</span>` : n === toca ? `<span class="nivel-marca">${SVG_JUGAR}</span>` : '');
    b.onclick = () => {
      if (!abierto) return Voz.decir('nivel-cerrado');
      if (!listo) return Voz.decir('nivel-pronto');
      empezar(n);
    };
    parada.appendChild(b);
    if (abierto && listo) {
      parada.insertAdjacentHTML('beforeend', `<span class="estrellitas" aria-label="${ganadas} estrellas">` +
        [1, 2, 3].map(i => SVG_ESTRELLA.replace('<svg', `<svg class="${i <= ganadas ? 'si' : ''}"`)).join('') + '</span>');
    }
    parada.insertAdjacentHTML('beforeend', `<span class="parada-nombre">${NOMBRE_NIVEL[n]}</span>`);
    if (n === toca) parada.insertAdjacentHTML('afterbegin', '<span class="globo">¡Este!</span>');
    camino.appendChild(parada);
  }
  camino.dataset.toca = toca;
  dibujarCamino();

  ayuda = () => Voz.decir('elegi-juego');
  if (!saludado) { saludado = true; Voz.decir('hola-capi', 'elegi-juego'); } else Voz.decir('elegi-juego');
}

// Ubica las paradas en zigzag y dibuja el camino que las une. Se rehace al cambiar el tamaño.
function dibujarCamino() {
  const camino = $('#camino');
  if (!$('#p-niveles').classList.contains('activa') || !camino.children.length) return;
  const W = camino.clientWidth, H = camino.clientHeight;
  const vertical = H > W;
  const paradas = [...camino.querySelectorAll('.parada')];
  const puntos = paradas.map((p, i) => {
    const t = 0.1 + (i * 0.8) / (paradas.length - 1);
    const x = vertical ? (i % 2 ? 0.7 : 0.3) * W : t * W;
    const y = vertical ? t * H : (i % 2 ? 0.34 : 0.64) * H;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    return [x, y];
  });
  // Curvas suaves entre parada y parada.
  const tramo = (a, b) => vertical
    ? `C${a[0]} ${(a[1] + b[1]) / 2} ${b[0]} ${(a[1] + b[1]) / 2} ${b[0]} ${b[1]}`
    : `C${(a[0] + b[0]) / 2} ${a[1]} ${(a[0] + b[0]) / 2} ${b[1]} ${b[0]} ${b[1]}`;
  const recorrido = hasta => `M${puntos[0][0]} ${puntos[0][1]}` + puntos.slice(1, hasta + 1).map((p, i) => tramo(puntos[i], p)).join('');
  const grosor = Math.max(18, Math.min(40, Math.min(W, H) * 0.05));
  const toca = Number(camino.dataset.toca);
  const hecho = toca > 0 ? toca : toca === -1 ? puntos.length - 1 : 0;
  const viejo = camino.querySelector('svg.trazo');
  if (viejo) viejo.remove();
  camino.insertAdjacentHTML('afterbegin',
    `<svg class="trazo" viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
    `<path d="${recorrido(puntos.length - 1)}" fill="none" stroke="#1D3557" stroke-width="${grosor}" stroke-linecap="round"/>` +
    `<path d="${recorrido(puntos.length - 1)}" fill="none" stroke="#FFFFFF" stroke-width="${grosor * 0.7}" stroke-linecap="round"/>` +
    (hecho > 0 ? `<path d="${recorrido(hecho)}" fill="none" stroke="#FFC93C" stroke-width="${grosor * 0.7}" stroke-linecap="round"/>` : '') +
    '</svg>');
}
window.addEventListener('resize', dibujarCamino);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarCamino);

function empezar(n) {
  nivelActual = n;
  [nivel0, nivel1, nivel2, nivel3, nivel4][n]();
}

// ---------- La mesa ----------
// modo: 'partida' (bazas y cantos), 'duelo' (nivel 1), 'practica' (envido), 'tabla', 'palos' o 'intro' (nivel 0).
function prepararJuego(modo) {
  mostrar('juego');
  const p = $('#p-juego');
  p.className = 'pantalla activa modo-' + modo;
  $('#tablero').innerHTML = '';
  $('#mano').innerHTML = '';
  $('#cantos').innerHTML = '';
  $('#marcador').innerHTML = '';
  $('#dorsos').innerHTML = '';
  globoToca(false);
}
const globoToca = si => $('#globo-toca').classList.toggle('ver', si);

// Cartas boca abajo que le quedan a Capi.
function pintarDorsos(n) {
  const d = $('#dorsos');
  d.innerHTML = '';
  for (let i = 0; i < n; i++) d.appendChild(crearDorso());
}

// Marcador de una partida: una fila para Capi y otra para el nene, con un puntito por punto.
// puntos: [del nene, de Capi].
function pintarMarcador(meta, puntos) {
  const fila = (cara, n, clase) => `<div class="marcador-fila"><span class="cara">${cara}</span>` +
    `<span class="puntitos">${Array.from({ length: meta }, (_, i) => `<i class="${i < n ? clase : ''}"></i>`).join('')}</span></div>`;
  $('#marcador').innerHTML = `<div class="marcador" role="img" aria-label="Capi ${puntos[1]}, vos ${puntos[0]}">` +
    fila(IMG_CAPI, puntos[1], 'capi') + fila(SVG_NENE, puntos[0], 'yo') + '</div>';
}

// Puntitos de avance: resultados con 1 (bien) o -1 (mal); el siguiente queda marcado.
function pintarAvance(total, resultados) {
  $('#marcador').innerHTML = '<div class="marcador avance" role="img" aria-label="Paso ' + Math.min(resultados.length + 1, total) + ' de ' + total + '">' +
    Array.from({ length: total }, (_, i) => {
      const r = resultados[i];
      return `<i class="${r === 1 ? 'bien' : r === -1 ? 'mal' : i === resultados.length ? 'ahora' : ''}"></i>`;
    }).join('') + '</div>';
}

// Las tres bazas de una ronda. bazaUI es la baza en la que se está jugando: la lleva la pantalla
// (no el motor), porque cuando se narra la carta que cierra una baza el motor ya pasó a la siguiente.
let bazaUI = 0;
function limpiarBazas() {
  bazaUI = 0;
  $('#tablero').innerHTML = '<div class="bazas">' + [0, 1, 2].map(i =>
    `<div class="baza" id="baza-${i}"><div class="lugar arriba"></div><div class="lugar abajo">${icono('flecha', 3)}</div><div class="ficha"></div></div>`
  ).join('') + '</div>';
}
function poner(quien, c) {
  const baza = $('#baza-' + bazaUI);
  if (!baza) return;
  const lugar = baza.querySelector(quien === 'yo' ? '.abajo' : '.arriba');
  lugar.querySelectorAll('.carta').forEach(x => x.remove());
  const el = crearCarta(c, { conFuerza: false });
  el.disabled = true;
  lugar.appendChild(el);
  Voz.sonido('carta');
}
// Cierra la baza actual. g: 1 ganó el nene, -1 ganó Capi, 0 parda.
function cerrarBaza(g) {
  const baza = $('#baza-' + bazaUI);
  if (!baza) return;
  baza.classList.remove('toca');
  if (g !== 0) baza.querySelector(g === 1 ? '.arriba .carta' : '.abajo .carta')?.classList.add('apagada');
  const ficha = baza.querySelector('.ficha');
  ficha.classList.add('llena');
  ficha.innerHTML = g === 1 ? SVG_NENE : g === -1 ? IMG_CAPI : icono('igual', 3);
  bazaUI++;
}
// Marca la baza en la que le toca jugar al nene.
function marcarToca(si) {
  document.querySelectorAll('.baza.toca').forEach(b => b.classList.remove('toca'));
  const baza = $('#baza-' + bazaUI);
  if (si && baza) baza.classList.add('toca');
  globoToca(si);
}

// Botón grande amarillo para seguir (final del nivel 0).
function botonSeguir(alTocar) {
  const b = document.createElement('button');
  b.className = 'btn grande sol';
  b.setAttribute('aria-label', 'Seguir');
  b.innerHTML = icono('listo', 3);
  b.onclick = alTocar;
  $('#cantos').appendChild(b);
  return b;
}

// ---------- Nivel 0: conocer las cartas ----------
// Escalones de la tabla, de la carta más fuerte (14) a la más bajita (1).
const ESCALONES = Array.from({ length: FUERZA_MAX }, (_, i) => FUERZA_MAX - i)
  .map(f => ({ f, cartas: MAZO.filter(c => c.f === f) }));

// Paso de los cuatro dibujitos: termina cuando tocó los cuatro. Devuelve si el nivel sigue vivo.
function pasoPalos(vivo) {
  return new Promise(ok => {
    const tablero = $('#tablero');
    tablero.innerHTML = '<div class="palos"></div>';
    const tocados = new Set();
    let hecho = false;
    const botones = PALOS.map(palo => {
      const b = crearPalo(palo);
      b.onclick = () => {
        if (hecho) return;
        tocados.add(palo);
        b.classList.add('tocado');
        b.classList.remove('sugerida');
        Voz.sonido('carta');
        if (tocados.size < PALOS.length) { Voz.decir('palo-' + palo); return; }
        // El toque que completa los cuatro cierra el paso enseguida, antes de cualquier await.
        hecho = true;
        ayuda = () => {};
        botones.forEach(x => { x.disabled = true; });
        Voz.decir('palo-' + palo, 'n0-palos-bien').then(() => ok(vivo()));
      };
      tablero.firstChild.appendChild(b);
      return b;
    });
    ayuda = () => {
      botones.forEach((b, k) => { if (!tocados.has(PALOS[k])) b.classList.add('sugerida'); });
      Voz.decir('n0-palos');
    };
    Voz.decir('n0-palos');
  });
}

// Un tramo de la tabla: el lugar siguiente brilla y al tocarlo se destapan sus cartas y se
// escucha su frase. Los ya destapados se pueden tocar para volver a escucharlos.
// Devuelve una promesa que termina (con si el nivel sigue vivo) cuando se destapan todos.
// Al terminar, el tramo queda bloqueado para que un toque no corte la frase que sigue;
// control.liberar() lo vuelve a habilitar para explorar.
function pasoTabla(escalones, desde, intro, vivo, control = {}) {
  return new Promise(ok => {
    const tablero = $('#tablero');
    tablero.innerHTML = '';
    const grilla = document.createElement('div');
    grilla.className = 'grilla grilla-' + escalones.length;
    tablero.appendChild(grilla);
    let siguiente = 0;
    let ocupado = false; // mientras habla un escalón recién destapado, no se toca nada
    control.liberar = () => { ocupado = false; };
    const lugares = escalones.map((esc, k) => {
      const lugar = document.createElement('div');
      lugar.className = 'escalon cartas-' + esc.cartas.length;
      lugar.setAttribute('role', 'button');
      lugar.setAttribute('aria-label', FRASES['tabla-' + esc.f]);
      lugar.innerHTML = `<span class="escalon-num">${desde + k + 1}</span><span class="hueco"></span>` +
        `<span class="barrita"><i style="width:${Math.round((esc.f / FUERZA_MAX) * 100)}%"></i></span>`;
      lugar.onclick = async () => {
        if (ocupado || !vivo()) return;
        if (k < siguiente) { Voz.decir('tabla-' + esc.f); return; }
        if (k !== siguiente) return;
        ocupado = true;
        siguiente++;
        lugar.classList.remove('sugerida');
        lugar.classList.add('destapado');
        esc.cartas.forEach(c => { const el = crearCarta(c, { conFuerza: false }); el.disabled = true; lugar.appendChild(el); });
        Voz.sonido('carta');
        await Voz.decir('tabla-' + esc.f);
        if (!vivo()) return ok(false);
        if (siguiente < lugares.length) {
          ocupado = false;
          lugares[siguiente].classList.add('sugerida');
        } else ok(true);
      };
      grilla.appendChild(lugar);
      return lugar;
    });
    lugares[0].classList.add('sugerida');
    ayuda = () => { if (!ocupado) Voz.decir(intro); };
    Voz.decir(intro);
  });
}

async function nivel0() {
  const id = ++partida;
  const vivo = () => id === partida;
  prepararJuego('intro');
  pintarAvance(3, []);

  // Paso A: qué es el truco. No se puede saltear tocando a Capi.
  barajar(MAZO).slice(0, 3).forEach(c => {
    const el = crearCarta(c, { conFuerza: false });
    el.disabled = true;
    $('#tablero').appendChild(el);
  });
  ayuda = () => {};
  await Voz.decir('n0-intro');
  if (!vivo()) return;

  // Paso B: los cuatro dibujitos.
  prepararJuego('palos');
  pintarAvance(3, [1]);
  if (!(await pasoPalos(vivo))) return;
  await espera(600);
  if (!vivo()) return;

  // Paso C: la tabla en dos tramos. Primero las campeonas, después el resto.
  prepararJuego('tabla');
  pintarAvance(3, [1, 1]);
  if (!(await pasoTabla(ESCALONES.slice(0, 4), 0, 'n0-campeonas', vivo))) return;
  ayuda = () => {};
  await Voz.decir('n0-campeonas-fin');
  if (!vivo()) return;
  await espera(800);
  if (!vivo()) return;
  const resto = {};
  if (!(await pasoTabla(ESCALONES.slice(4), 4, 'n0-resto', vivo, resto))) return;
  resto.liberar();

  // Final: puede explorar la tabla; el botón amarillo (acción principal) termina el nivel.
  pintarAvance(3, [1, 1, 1]);
  const listo = botonSeguir(() => terminar(0, 3));
  ayuda = () => { listo.classList.add('sugerida'); Voz.decir('n0-tabla-fin'); };
  Voz.decir('n0-tabla-fin');
}

// ---------- Nivel 1: ¿qué carta gana? ----------
async function nivel1() {
  const id = ++partida;
  const vivo = () => id === partida;
  const TOTAL = 8, CON_BARRA = 5;
  const resultados = [];
  prepararJuego('duelo');
  pintarAvance(TOTAL, resultados);
  ayuda = () => {};
  await Voz.decir('n1-intro');
  if (!vivo()) return;

  for (let i = 0; i < TOTAL; i++) {
    if (i === CON_BARRA) {
      ayuda = () => {};
      await Voz.decir('n1-sin-barra');
      if (!vivo()) return;
    }
    const conFuerza = i < CON_BARRA;
    // Dos cartas de fuerza distinta; al principio, bien distinta.
    let a, b;
    do { [a, b] = barajar(MAZO); } while (Math.abs(a.f - b.f) < (i < 3 ? 4 : 1));
    const mejor = a.f > b.f ? a : b;

    const tablero = $('#tablero');
    tablero.innerHTML = '';
    const botones = [a, b].map(c => {
      const el = crearCarta(c, { conFuerza });
      tablero.appendChild(el);
      return el;
    });
    ayuda = () => Voz.decir('n1-pregunta');
    Voz.decir('n1-pregunta');
    const elegida = await new Promise(ok => botones.forEach((el, k) => { el.onclick = () => ok([a, b][k]); }));
    if (!vivo()) return;

    botones.forEach((el, k) => {
      el.onclick = null;
      el.classList.add('con-fuerza');
      el.classList.add([a, b][k] === mejor ? 'gana' : 'pierde');
    });
    ayuda = () => {};
    const acerto = elegida === mejor;
    resultados.push(acerto ? 1 : -1);
    pintarAvance(TOTAL, resultados);
    Voz.sonido(acerto ? 'bien' : 'casi');
    await (acerto ? Voz.decir('muy-bien', 'gana', mejor.id) : Voz.decir('casi', 'mas-fuerte-es', mejor.id));
    if (!vivo()) return;
    await espera(500);
    if (!vivo()) return;
  }
  const aciertos = resultados.filter(r => r === 1).length;
  terminar(1, aciertos >= 7 ? 3 : aciertos >= 5 ? 2 : 1);
}

// ---------- Nivel 2: ganar la ronda (mejor de tres) ----------
// res: resultado de cada mano (1 chico, -1 Capi, 0 parda). Devuelve quién ganó la ronda o null.
function ganadorRonda(res, mano) {
  const [a, b, c] = res;
  if (res.length >= 2) {
    if (a !== 0 && a === b) return a;
    if (a === 0 && b !== 0) return b;
    if (a !== 0 && b === 0) return a;
  }
  if (res.length === 3) {
    if (c !== 0) return c;
    if (a !== 0) return a;
    return mano;
  }
  return null;
}

// Qué carta conviene: si hay una en la mesa, la más baja que le gane (o la más baja de todas).
function elegirCarta(cartas, contra, alAbrir) {
  const orden = cartas.slice().sort((x, y) => x.f - y.f);
  if (contra) return orden.find(c => c.f > contra.f) || orden[0];
  return alAbrir === 'fuerte' ? orden[orden.length - 1] : orden[Math.floor(Math.random() * orden.length)];
}

async function nivel2() {
  const id = ++partida;
  const vivo = () => id === partida;
  const RONDAS = 3;
  let ganadas = 0, perdidas = 0;
  prepararJuego('partida');
  limpiarBazas();
  pintarMarcador(RONDAS, [0, 0]);
  ayuda = () => {};
  await Voz.decir('n2-intro-capi');
  if (!vivo()) return;

  for (let r = 0; r < RONDAS; r++) {
    const mazo = barajar(MAZO);
    const mia = mazo.slice(0, 3), suya = mazo.slice(3, 6);
    const mano = r % 2 === 0 ? 1 : -1;
    const guiado = r === 0; // en la primera ronda Capi muestra qué carta conviene
    const res = [];
    let turno = mano;
    limpiarBazas();
    pintarDorsos(suya.length);
    $('#mano').innerHTML = '';
    if (r > 0) {
      ayuda = () => {};
      await Voz.decir('otra-ronda');
      if (!vivo()) return;
    }

    while (ganadorRonda(res, mano) === null) {
      let deCapi = null;
      if (turno === -1) {
        deCapi = elegirCarta(suya, null);
        suya.splice(suya.indexOf(deCapi), 1);
        pintarDorsos(suya.length);
        poner('capi', deCapi);
        await Voz.decir('capi-tira', deCapi.id);
        if (!vivo()) return;
      }

      // Le toca al chico
      const sugerida = elegirCarta(mia, deCapi, 'fuerte');
      const pista = !deCapi ? 'pista-fuerte' : sugerida.f > deCapi.f ? 'pista-le-gana' : 'pista-baja';
      const cont = $('#mano');
      cont.innerHTML = '';
      const botones = mia.map(c => {
        const el = crearCarta(c);
        cont.appendChild(el);
        return el;
      });
      marcarToca(true);
      const marcar = () => botones[mia.indexOf(sugerida)].classList.add('sugerida');
      ayuda = () => { marcar(); Voz.decir(pista); };
      if (guiado) { marcar(); Voz.decir(pista); } else Voz.decir('te-toca');
      const mi = await new Promise(ok => botones.forEach((el, k) => { el.onclick = () => ok(mia[k]); }));
      if (!vivo()) return;
      ayuda = () => {};
      Voz.parar();
      marcarToca(false);
      mia.splice(mia.indexOf(mi), 1);
      cont.innerHTML = '';
      mia.forEach(c => { const el = crearCarta(c); el.disabled = true; cont.appendChild(el); });
      poner('yo', mi);

      if (turno === 1) {
        await espera(800);
        if (!vivo()) return;
        deCapi = elegirCarta(suya, mi);
        suya.splice(suya.indexOf(deCapi), 1);
        pintarDorsos(suya.length);
        poner('capi', deCapi);
        await Voz.decir('capi-tira', deCapi.id);
        if (!vivo()) return;
      }

      const g = mi.f > deCapi.f ? 1 : mi.f < deCapi.f ? -1 : 0;
      res.push(g);
      cerrarBaza(g);
      Voz.sonido(g === 1 ? 'bien' : 'casi');
      await Voz.decir(g === 1 ? 'mano-tuya' : g === -1 ? 'mano-capi' : 'parda');
      if (!vivo()) return;
      await espera(700);
      if (!vivo()) return;
      turno = g !== 0 ? g : mano; // después de una parda sale el que es mano
    }

    $('#mano').innerHTML = '';
    const quien = ganadorRonda(res, mano);
    if (quien === 1) ganadas++; else perdidas++;
    pintarMarcador(RONDAS, [ganadas, perdidas]);
    await Voz.decir(quien === 1 ? 'ronda-tuya' : 'ronda-capi');
    if (!vivo()) return;
  }
  terminar(2, ganadas >= 2 ? 3 : ganadas === 1 ? 2 : 1);
}

// ---------- Partidas contra Capi (niveles 3 y 4) ----------
function mostrarMano(e, tocable) {
  const mano = $('#mano');
  mano.innerHTML = '';
  return e.manos[YO].map(c => {
    const el = crearCarta(c);
    el.disabled = !tocable;
    mano.appendChild(el);
    return el;
  });
}
// Dice cómo se cuentan unos tantos: "Veinte más 7 más 6 son 33", o solo el número si no hay par.
function frasesCuenta(cartas) {
  const total = Motor.tantos(cartas);
  if (cartas.length < 2) return ['num-' + total];
  const v = c => (c.n >= 10 ? 0 : c.n);
  return ['veinte', 'mas', 'num-' + v(cartas[0]), 'mas', 'num-' + v(cartas[1]), 'son', 'num-' + total];
}
const hayFigura = cartas => cartas.some(c => c.n >= 10);

const YO = 0, CAPI = 1;
const BOTON_CANTO = {
  'truco': { icono: 'megafono', puntos: 2 },
  'retruco': { icono: 'megafono', puntos: 3 },
  'vale-cuatro': { icono: 'megafono', puntos: 4 },
  'envido': { icono: 'envido', envido: true },
  'real-envido': { icono: 'envido', envido: true },
  'quiero': { icono: 'arriba' },
  'no-quiero': { icono: 'abajo' },
};
// Cuánto vale el envido si se acepta, y cuánto gana el que cantó si no se acepta.
const envidoEnJuego = cantos => cantos.reduce((s, c) => s + Motor.VALOR_ENVIDO[c], 0);
const envidoNoQuerido = cantos => (cantos.length === 1 ? 1 : envidoEnJuego(cantos.slice(0, -1)));

// Muestra la mano y los botones de canto, y espera a que el chico elija.
function pedirAccion(e, guiado, excluir) {
  const permitidas = Motor.acciones(e).filter(a => !excluir.includes(a.tipo));
  const puedeTirar = permitidas.some(a => a.tipo === 'carta');
  const sugerida = Bot.elegir(e, () => 0, excluir);
  const rival = e.mesa[CAPI];
  const esEnvido = !!e.envido.pendiente;
  const pista = {
    'carta': () => (!rival ? 'pista-fuerte' : sugerida.carta.f > rival.f ? 'pista-le-gana' : 'pista-baja'),
    'truco': () => 'pista-truco',
    'retruco': () => 'pista-subir',
    'vale-cuatro': () => 'pista-subir',
    'envido': () => 'pista-envido',
    'real-envido': () => 'pista-real-envido',
    'quiero': () => (esEnvido ? 'pista-quiero-envido' : 'pista-quiero'),
    'no-quiero': () => (esEnvido ? 'pista-no-quiero-envido' : 'pista-no-quiero'),
  }[sugerida.tipo]();

  return new Promise(ok => {
    let elegido = false;
    const elegir = a => {
      if (elegido) return;
      elegido = true;
      ayuda = () => {};
      Voz.parar();
      marcarToca(false);
      $('#cantos').innerHTML = '';
      document.querySelectorAll('#mano .carta').forEach(el => { el.disabled = true; el.classList.remove('sugerida'); });
      ok(a);
    };
    let elSugerido = null;
    mostrarMano(e, puedeTirar).forEach((el, k) => {
      const c = e.manos[YO][k];
      el.onclick = () => elegir({ tipo: 'carta', carta: c });
      if (sugerida.tipo === 'carta' && sugerida.carta.id === c.id) elSugerido = el;
    });
    if (puedeTirar) marcarToca(true);
    const cantos = $('#cantos');
    cantos.innerHTML = '';
    permitidas.filter(a => a.tipo !== 'carta').forEach(a => {
      const info = BOTON_CANTO[a.tipo];
      // Los puntitos muestran cuánto pasa a valer si el otro dice quiero.
      const puntos = info.envido ? envidoEnJuego([...e.envido.cantos, a.tipo]) : info.puntos;
      const b = document.createElement('button');
      b.className = 'btn canto canto-' + a.tipo;
      b.setAttribute('aria-label', FRASES['yo-' + a.tipo]);
      b.innerHTML = icono(info.icono, 2.4) + (puntos ? `<span class="vale">${'<i></i>'.repeat(puntos)}</span>` : '');
      b.onclick = () => elegir(a);
      if (sugerida.tipo === a.tipo) elSugerido = b;
      cantos.appendChild(b);
    });
    const marcar = () => elSugerido.classList.add('sugerida');
    ayuda = () => { marcar(); Voz.decir(pista); };
    if (guiado) { marcar(); Voz.decir(pista); } else if (puedeTirar) Voz.decir('te-toca');
  });
}

// Muestra los tantos de los dos cuando se quiere el envido.
async function mostrarEnvido(ev, e, vivo, avisos) {
  const [mias, suyas] = ev.cartas;
  // Las figuras se explican una sola vez por partida, junto a la cuenta de quien las tiene:
  // si forman parte del par, o si no hay par y alguna figura está en la mano.
  const explicarFiguras = (tantos, mano) => {
    if (avisos.figuras || !hayFigura(tantos.length === 2 ? tantos : mano)) return [];
    avisos.figuras = true;
    return ['figuras-cero'];
  };
  const brillos = mias.map(c => document.querySelector(`#mano [data-id="${c.id}"], .baza [data-id="${c.id}"]`)).filter(Boolean);
  brillos.forEach(el => el.classList.add('brilla'));
  const frases = ['vos-tenes', ...frasesCuenta(mias)];
  if (mias.length < 2) frases.push('sin-par-yo');
  frases.push(...explicarFiguras(mias, e.repartidas[YO]));
  await Voz.decir(...frases);
  if (!vivo()) return false;

  // Las cartas de Capi se muestran donde van los botones, que en este momento están vacíos,
  // para no tapar lo que hay en la mesa.
  const muestra = document.createElement('div');
  muestra.className = 'muestra';
  muestra.innerHTML = `<span class="capi">${IMG_CAPI}</span><div class="muestra-cartas"></div>`;
  suyas.forEach(c => {
    const el = crearCarta(c, { conFuerza: false });
    el.disabled = true;
    el.classList.add('brilla');
    muestra.lastChild.appendChild(el);
  });
  $('#cantos').appendChild(muestra);
  const deCapi = ['capi-tiene', ...frasesCuenta(suyas)];
  if (suyas.length < 2) deCapi.push('sin-par-capi');
  deCapi.push(...explicarFiguras(suyas, e.repartidas[CAPI]));
  deCapi.push(ev.tantos[0] === ev.tantos[1] ? 'envido-empate' : ev.ganador === YO ? 'envido-tuyo' : 'envido-capi');
  await Voz.decir(...deCapi);
  if (!vivo()) return false;
  await espera(1200);
  if (!vivo()) return false;
  muestra.remove();
  brillos.forEach(el => el.classList.remove('brilla'));
  return true;
}

// Cuenta en voz alta y muestra lo que pasó. Devuelve false si se salió del nivel.
async function contar(eventos, e, vivo, avisos) {
  for (const ev of eventos) {
    const mio = ev.jugador === YO;
    if (ev.tipo === 'carta') {
      poner(mio ? 'yo' : 'capi', ev.carta);
      if (mio) mostrarMano(e, false);
      else {
        pintarDorsos(e.manos[CAPI].length);
        await Voz.decir('capi-tira', ev.carta.id);
      }
    } else if (ev.tipo === 'baza') {
      cerrarBaza(ev.ganador === YO ? 1 : ev.ganador === CAPI ? -1 : 0);
      Voz.sonido(ev.ganador === YO ? 'bien' : 'casi');
      await Voz.decir(ev.ganador === YO ? 'mano-tuya' : ev.ganador === CAPI ? 'mano-capi' : 'parda');
      if (!vivo()) return false;
      await espera(700);
    } else if (ev.tipo === 'canto') {
      const esEnvido = ev.canto === 'envido' || ev.canto === 'real-envido';
      if (mio) await Voz.decir('yo-' + ev.canto);
      else if (esEnvido) {
        const c = e.envido.cantos;
        await Voz.decir('capi-' + ev.canto, 'si-quiero-envido-' + envidoEnJuego(c), 'si-no-quiero-capi-' + envidoNoQuerido(c));
      } else await Voz.decir('capi-' + ev.canto);
    } else if (ev.tipo === 'respuesta') {
      const frases = [(mio ? 'yo-' : 'capi-') + (ev.quiero ? 'quiero' : 'no-quiero')];
      if (ev.quiero && ev.canto !== 'envido') frases.push('vale-' + (e.truco.nivel + 1));
      await Voz.decir(...frases);
    } else if (ev.tipo === 'envido') {
      if (!(await mostrarEnvido(ev, e, vivo, avisos))) return false;
    } else if (ev.tipo === 'truco-en-espera') {
      await Voz.decir(mio ? 'truco-espera-tuyo-capi' : 'truco-espera-capi');
    } else if (ev.tipo === 'puntos') {
      pintarMarcador(e.meta, e.puntos);
      Voz.sonido(mio ? 'bien' : 'casi');
      await Voz.decir((mio ? 'ganaste-' : 'capi-gano-') + ev.puntos);
    } else if (ev.tipo === 'fin-partida') {
      await Voz.decir(ev.ganador === YO ? 'partida-tuya' : 'partida-capi');
    }
    if (!vivo()) return false;
  }
  return true;
}

// Partida contra Capi. Las primeras rondas pueden venir armadas (reparto(n) devuelve
// las cartas de la ronda n, o nada para repartir al azar); en esas Capi guía.
async function jugarPartida({ nivel, meta, excluir, intro, reparto, id }) {
  const vivo = () => id === partida;
  const e = Motor.nuevaPartida({ meta, mano: YO });
  const avisos = {};
  prepararJuego('partida');
  limpiarBazas();
  pintarMarcador(e.meta, e.puntos);
  ayuda = () => {};
  await Voz.decir(intro);
  if (!vivo()) return;

  while (e.fase !== 'fin-partida') {
    const cartas = reparto(e.rondas);
    const guiado = !!cartas;
    Motor.nuevaRonda(e, cartas);
    limpiarBazas();
    pintarDorsos(e.manos[CAPI].length);
    mostrarMano(e, false);
    if (e.rondas > 1) {
      ayuda = () => {};
      await Voz.decir('otra-ronda');
      if (!vivo()) return;
    }
    while (e.fase === 'jugando') {
      let accion;
      if (Motor.actor(e) === CAPI) {
        await espera(700);
        if (!vivo()) return;
        accion = Bot.elegir(e, guiado ? () => 0 : Math.random, excluir);
      } else {
        accion = await pedirAccion(e, guiado, excluir);
        if (!vivo()) return;
      }
      if (!(await contar(Motor.aplicar(e, accion), e, vivo, avisos))) return;
    }
    $('#mano').innerHTML = '';
    $('#cantos').innerHTML = '';
  }
  terminar(nivel, e.ganador === YO ? 3 : e.puntos[YO] >= Math.ceil(meta / 2) ? 2 : 1);
}

// Saca del mazo las cartas pedidas, en orden. Cada condición elige una carta que todavía esté.
function armarMano(m, condiciones) {
  return condiciones.map(cond => m.splice(m.findIndex(cond), 1)[0]);
}
const es = (n, palo) => c => c.n === n && c.palo === palo;

// ---------- Nivel 3: el truco ----------
// Las dos primeras rondas enseñan: en la primera el chico tiene cartas para cantar truco;
// en la segunda Capi canta y conviene no querer.
function repartoTruco(n) {
  if (n > 1) return undefined;
  const m = barajar(MAZO);
  const fuertes = armarMano(m, [c => c.f === (n === 0 ? 14 : 13), c => c.f === (n === 0 ? 11 : 12), c => c.f <= 3]);
  const flojas = n === 0
    ? armarMano(m, [c => c.f === 10, c => c.f >= 4 && c.f <= 8, c => c.f >= 4 && c.f <= 8])
    : armarMano(m, [c => c.f <= 5, c => c.f <= 5, c => c.f <= 5]);
  return n === 0 ? [fuertes, flojas] : [flojas, fuertes];
}

function nivel3() {
  jugarPartida({ nivel: 3, meta: 6, excluir: ['envido', 'real-envido', 'mazo'], intro: 'n3-intro', reparto: repartoTruco, id: ++partida });
}

// ---------- Nivel 4: el envido ----------
// Ronda 1: el chico es mano con 33 y Capi tiene 28 sin cartas para el truco, así que
// Capi quiere y se ve la comparación. Ronda 2: Capi es mano con 31, sin cartas de
// truco, y canta envido; el chico tiene 6 sin par y le conviene no querer.
function repartoEnvido(n) {
  if (n === 0) return [
    [es(7, 'copa'), es(6, 'copa'), es(4, 'espada')].map(f => MAZO.find(f)),
    [es(3, 'oro'), es(5, 'oro'), es(12, 'basto')].map(f => MAZO.find(f)),
  ];
  if (n === 1) return [
    [es(6, 'espada'), es(5, 'oro'), es(4, 'copa')].map(f => MAZO.find(f)),
    [es(7, 'basto'), es(4, 'basto'), es(5, 'copa')].map(f => MAZO.find(f)),
  ];
  return undefined;
}

// Una mano de práctica: un par del mismo palo y una tercera de otro palo, mezcladas.
// Con conFigura, una de las dos del par es un 10, 11 o 12.
function manoPractica(conFigura) {
  const m = barajar(MAZO);
  const primera = m.find(c => (conFigura ? c.n >= 10 : c.n < 10));
  const segunda = m.find(c => c.palo === primera.palo && c !== primera && c.n < 10);
  const tercera = m.find(c => c.palo !== primera.palo);
  return barajar([primera, segunda, tercera]);
}

async function practicaPar(vivo) {
  const MANOS = 4;
  const resultados = [];
  prepararJuego('practica');
  pintarAvance(MANOS, resultados);
  ayuda = () => {};
  await Voz.decir('n4-intro');
  if (!vivo()) return false;
  let figurasDichas = false;

  for (let i = 0; i < MANOS; i++) {
    const cartas = manoPractica(i === 1);
    const par = cartas.filter(c => cartas.filter(x => x.palo === c.palo).length === 2);
    const tablero = $('#tablero');
    tablero.innerHTML = '<div class="numero-grande" id="numero"></div>';
    const els = cartas.map(c => { const el = crearCarta(c, { conFuerza: false }); tablero.appendChild(el); return el; });
    let fallos = 0;

    // Espera a que toque dos cartas. Tocar la misma otra vez la baja.
    const elegirDos = () => new Promise(ok => {
      const elegidas = [];
      els.forEach((el, k) => {
        el.onclick = () => {
          const ya = elegidas.indexOf(k);
          if (ya >= 0) { elegidas.splice(ya, 1); el.classList.remove('elegida'); return; }
          elegidas.push(k);
          el.classList.add('elegida');
          Voz.sonido('carta');
          if (elegidas.length === 2) { els.forEach(x => { x.onclick = null; }); ok(elegidas.map(j => cartas[j])); }
        };
      });
    });

    const pistaPar = () => { els.forEach((el, k) => { if (par.includes(cartas[k])) el.classList.add('sugerida'); }); Voz.decir('n4-toca-par'); };
    ayuda = pistaPar;
    Voz.decir('n4-toca-par');
    for (;;) {
      const [a, b] = await elegirDos();
      if (!vivo()) return false;
      if (a.palo === b.palo) break;
      fallos++;
      Voz.sonido('casi');
      ayuda = () => {};
      await Voz.decir('n4-no-par');
      if (!vivo()) return false;
      els.forEach(el => el.classList.remove('elegida'));
      ayuda = pistaPar;
      if (fallos >= 2) pistaPar();
    }
    ayuda = () => {};
    resultados.push(fallos === 0 ? 1 : -1);
    pintarAvance(MANOS, resultados);
    els.forEach((el, k) => {
      el.classList.remove('elegida', 'sugerida');
      el.classList.add(par.includes(cartas[k]) ? 'brilla' : 'pierde');
    });
    Voz.sonido('bien');
    $('#numero').textContent = Motor.tantos(par);
    const frases = ['n4-par-bien'];
    if (hayFigura(par) && !figurasDichas) { frases.push('figuras-cero'); figurasDichas = true; }
    await Voz.decir(...frases, ...frasesCuenta(par));
    if (!vivo()) return false;
    await espera(800);
    if (!vivo()) return false;
  }
  return true;
}

async function nivel4() {
  const id = ++partida;
  const vivo = () => id === partida;
  if (!(await practicaPar(vivo))) return;
  jugarPartida({ nivel: 4, meta: 9, excluir: ['mazo'], intro: 'n4-partida-capi', reparto: repartoEnvido, id });
}

// ---------- Fin de nivel ----------
function terminar(n, estrellas) {
  partida++;
  progreso.estrellas[n] = Math.max(progreso.estrellas[n] || 0, estrellas);
  guardar();
  mostrar('fin');
  $('#estrellas').innerHTML = [1, 2, 3].map(i =>
    SVG_ESTRELLA.replace('<svg', `<svg class="${i <= estrellas ? 'si' : ''}" style="animation-delay:${i * 0.25}s"`)).join('');
  $('#estrellas').setAttribute('aria-label', `${estrellas} estrellas`);
  $('#fin-titulo').textContent = estrellas >= 2 ? '¡Muy bien!' : '¡Buen intento!';
  $('#fin-globo').textContent = estrellas >= 2 ? '¡Bien jugado!' : '¿Otra vez?';
  Voz.sonido('estrella');
  const frases = ['estrellas-' + estrellas, estrellas >= 2 ? 'fin-bien' : 'fin-otra'];
  ayuda = () => Voz.decir(...frases);
  Voz.decir(...frases);
}

// ---------- Botones fijos ----------
$('#btn-aprender').onclick = () => { Voz.activar(); irANiveles(); };
$('#btn-inicio').onclick = () => {
  partida++;
  ayuda = () => {};
  Voz.parar();
  mostrar('inicio');
};
$('#btn-casa').onclick = () => irANiveles();
$('#btn-fin-niveles').onclick = () => irANiveles();
$('#btn-otra').onclick = () => empezar(nivelActual);
// Tocar a Capi o el parlante pide ayuda o repite lo último que hace falta escuchar.
document.querySelectorAll('.btn-ayuda, button.capi').forEach(b => { b.onclick = () => ayuda(); });

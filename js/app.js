// Pantallas y niveles.
const $ = s => document.querySelector(s);
const espera = ms => new Promise(r => setTimeout(r, ms));

const NIVELES_LISTOS = 2; // los niveles 3, 4 y 5 todavía no están hechos
const ICONOS_NIVEL = ['💪', '🖐️', '📣', '➕', '🏆'];

let progreso = { estrellas: {} };
try { progreso = JSON.parse(localStorage.getItem('truco-progreso')) || progreso; } catch (e) { /* sin guardado */ }
function guardar() {
  try { localStorage.setItem('truco-progreso', JSON.stringify(progreso)); } catch (e) { /* sin guardado */ }
}

let partida = 0;          // cambia cada vez que se entra o sale de un nivel
let ayuda = () => {};     // qué pasa al tocar al carpincho
let nivelActual = 1;

document.querySelectorAll('[data-carpincho]').forEach(e => { e.innerHTML = SVG_CARPINCHO; });
document.querySelectorAll('[data-zorro]').forEach(e => { e.innerHTML = SVG_ZORRO; });
Voz.alHablar(si => document.body.classList.toggle('hablando', si));

function mostrar(nombre) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === 'p-' + nombre));
}

// ---------- Elegir nivel ----------
function irANiveles(saludo) {
  partida++;
  mostrar('niveles');
  const cont = $('#niveles');
  cont.innerHTML = '';
  for (let n = 1; n <= 5; n++) {
    const abierto = n === 1 || (progreso.estrellas[n - 1] || 0) >= 2;
    const listo = n <= NIVELES_LISTOS;
    const b = document.createElement('button');
    b.className = 'nivel' + (abierto ? '' : ' cerrado') + (abierto && !listo ? ' pronto' : '');
    const ganadas = progreso.estrellas[n] || 0;
    b.innerHTML =
      `<span class="nivel-num">${n}</span>` +
      `<span class="nivel-icono">${abierto ? (listo ? ICONOS_NIVEL[n - 1] : '🚧') : '🔒'}</span>` +
      `<span class="nivel-estrellas">${[1, 2, 3].map(i => `<i class="${i <= ganadas ? 'si' : ''}">★</i>`).join('')}</span>`;
    b.onclick = () => {
      if (!abierto) return Voz.decir('nivel-cerrado');
      if (!listo) return Voz.decir('nivel-pronto');
      empezar(n);
    };
    cont.appendChild(b);
  }
  ayuda = () => Voz.decir('elegi-juego');
  if (saludo) Voz.decir('hola', 'elegi-juego'); else Voz.decir('elegi-juego');
}

function empezar(n) {
  nivelActual = n;
  if (n === 1) nivel1(); else nivel2();
}

function prepararJuego({ conMano, conZorro }) {
  mostrar('juego');
  $('#p-juego').classList.toggle('duelo', !conMano);
  $('#zorro').style.visibility = conZorro ? 'visible' : 'hidden';
  $('#mesa').innerHTML = '';
  $('#mano').innerHTML = '';
  $('#marcadores').innerHTML = '';
}

function pintarMarcadores(total, resultados) {
  // resultados: 1 = ganó el chico, -1 = no ganó, 0 = parda
  $('#marcadores').innerHTML = Array.from({ length: total }, (_, i) => {
    const r = resultados[i];
    const clase = r === undefined ? '' : r === 1 ? 'mio' : r === -1 ? 'suyo' : 'parda';
    return `<i class="${clase}"></i>`;
  }).join('');
}

// ---------- Nivel 1: ¿qué carta gana? ----------
async function nivel1() {
  const id = ++partida;
  const vivo = () => id === partida;
  const TOTAL = 8, CON_BARRA = 5;
  const resultados = [];
  prepararJuego({ conMano: false, conZorro: false });
  pintarMarcadores(TOTAL, resultados);
  ayuda = () => Voz.decir('n1-intro');
  await Voz.decir('n1-intro');
  if (!vivo()) return;

  for (let i = 0; i < TOTAL; i++) {
    if (i === CON_BARRA) {
      await Voz.decir('n1-sin-barra');
      if (!vivo()) return;
    }
    const conFuerza = i < CON_BARRA;
    // Dos cartas de fuerza distinta; al principio, bien distinta.
    let a, b;
    do { [a, b] = barajar(MAZO); } while (Math.abs(a.f - b.f) < (i < 3 ? 4 : 1));
    const mejor = a.f > b.f ? a : b;

    const mesa = $('#mesa');
    mesa.innerHTML = '';
    const botones = [a, b].map(c => {
      const el = crearCarta(c, { conFuerza });
      mesa.appendChild(el);
      return el;
    });
    ayuda = () => Voz.decir('n1-pregunta');
    Voz.decir('n1-pregunta');
    const elegida = await new Promise(ok => botones.forEach((el, k) => { el.onclick = () => ok([a, b][k]); }));
    if (!vivo()) return;

    botones.forEach((el, k) => {
      el.onclick = null;
      el.classList.remove('sin-fuerza');
      el.classList.add([a, b][k] === mejor ? 'gana' : 'pierde');
    });
    ayuda = () => {};
    const acerto = elegida === mejor;
    resultados.push(acerto ? 1 : -1);
    pintarMarcadores(TOTAL, resultados);
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
// res: resultado de cada mano (1 chico, -1 zorro, 0 parda). Devuelve quién ganó la ronda o null.
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
  let ganadas = 0;
  prepararJuego({ conMano: true, conZorro: true });
  const mesa = $('#mesa');
  mesa.innerHTML =
    `<div class="lugar"><div class="quien" data-zorro>${SVG_ZORRO}</div><div class="hueco" id="hueco-zorro"></div></div>` +
    `<div class="lugar"><div class="quien yo">★</div><div class="hueco" id="hueco-yo"></div></div>`;
  const poner = (quien, c) => {
    const h = $('#hueco-' + quien);
    h.innerHTML = '';
    if (c) { h.appendChild(crearCarta(c)); Voz.sonido('carta'); }
  };
  ayuda = () => Voz.decir('n2-intro');
  pintarMarcadores(3, []);
  await Voz.decir('n2-intro');
  if (!vivo()) return;

  for (let r = 0; r < RONDAS; r++) {
    const mazo = barajar(MAZO);
    const mia = mazo.slice(0, 3), suya = mazo.slice(3, 6);
    const mano = r % 2 === 0 ? 1 : -1;
    const guiado = r === 0; // en la primera ronda el carpincho muestra qué carta conviene
    const res = [];
    let turno = mano;
    pintarMarcadores(3, res);
    poner('zorro', null);
    poner('yo', null);
    if (r > 0) {
      await Voz.decir('otra-ronda');
      if (!vivo()) return;
    }

    while (ganadorRonda(res, mano) === null) {
      let delZorro = null;
      if (turno === -1) {
        delZorro = elegirCarta(suya, null);
        suya.splice(suya.indexOf(delZorro), 1);
        poner('zorro', delZorro);
        await Voz.decir('zorro-jugo', delZorro.id);
        if (!vivo()) return;
      }

      // Le toca al chico
      const sugerida = elegirCarta(mia, delZorro, 'fuerte');
      const pista = !delZorro ? 'pista-fuerte' : sugerida.f > delZorro.f ? 'pista-gana' : 'pista-baja';
      const cont = $('#mano');
      cont.innerHTML = '';
      const botones = mia.map(c => {
        const el = crearCarta(c);
        cont.appendChild(el);
        return el;
      });
      const marcar = () => botones[mia.indexOf(sugerida)].classList.add('sugerida');
      ayuda = () => { marcar(); Voz.decir(pista); };
      if (guiado) { marcar(); Voz.decir(pista); } else Voz.decir('te-toca');
      const mi = await new Promise(ok => botones.forEach((el, k) => { el.onclick = () => ok(mia[k]); }));
      if (!vivo()) return;
      ayuda = () => {};
      Voz.parar();
      mia.splice(mia.indexOf(mi), 1);
      cont.innerHTML = '';
      mia.forEach(c => { const el = crearCarta(c); el.disabled = true; cont.appendChild(el); });
      poner('yo', mi);

      if (turno === 1) {
        await espera(800);
        if (!vivo()) return;
        delZorro = elegirCarta(suya, mi);
        suya.splice(suya.indexOf(delZorro), 1);
        poner('zorro', delZorro);
        await Voz.decir('zorro-jugo', delZorro.id);
        if (!vivo()) return;
      }

      const g = mi.f > delZorro.f ? 1 : mi.f < delZorro.f ? -1 : 0;
      res.push(g);
      pintarMarcadores(3, res);
      if (g !== 0) {
        $('#hueco-yo .carta').classList.add(g === 1 ? 'gana' : 'pierde');
        $('#hueco-zorro .carta').classList.add(g === -1 ? 'gana' : 'pierde');
      }
      Voz.sonido(g === 1 ? 'bien' : 'casi');
      await Voz.decir(g === 1 ? 'mano-tuya' : g === -1 ? 'mano-zorro' : 'parda');
      if (!vivo()) return;
      await espera(700);
      if (!vivo()) return;
      poner('zorro', null);
      poner('yo', null);
      turno = g !== 0 ? g : mano; // después de una parda sale el que es mano
    }

    $('#mano').innerHTML = '';
    const quien = ganadorRonda(res, mano);
    if (quien === 1) ganadas++;
    await Voz.decir(quien === 1 ? 'ronda-tuya' : 'ronda-zorro');
    if (!vivo()) return;
  }
  terminar(2, ganadas >= 2 ? 3 : ganadas === 1 ? 2 : 1);
}

// ---------- Fin de nivel ----------
function terminar(n, estrellas) {
  partida++;
  progreso.estrellas[n] = Math.max(progreso.estrellas[n] || 0, estrellas);
  guardar();
  mostrar('fin');
  $('#estrellas').innerHTML = [1, 2, 3].map(i => `<i class="${i <= estrellas ? 'si' : ''}" style="animation-delay:${i * 0.25}s">★</i>`).join('');
  Voz.sonido('estrella');
  const frases = ['estrellas-' + estrellas, estrellas >= 2 ? 'fin-bien' : 'fin-otra'];
  ayuda = () => Voz.decir(...frases);
  Voz.decir(...frases);
}

// ---------- Botones fijos ----------
$('#btn-jugar').onclick = () => { Voz.activar(); irANiveles(true); };
$('#btn-casa').onclick = () => irANiveles(false);
$('#btn-fin-casa').onclick = () => irANiveles(false);
$('#btn-otra').onclick = () => empezar(nivelActual);
document.querySelectorAll('.carpincho.guia').forEach(c => { c.onclick = () => ayuda(); });

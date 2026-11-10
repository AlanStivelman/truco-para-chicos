// Pantallas y niveles.
const $ = s => document.querySelector(s);
const espera = ms => new Promise(r => setTimeout(r, ms));

const NIVELES_LISTOS = 4; // el nivel 5 todavía no está hecho
const ICONOS_NIVEL = ['libro', 'dos', 'tres', 'megafono', 'envido', 'trofeo'];

let progreso = { estrellas: {} };
try { progreso = JSON.parse(localStorage.getItem('truco-progreso')) || progreso; } catch (e) { /* sin guardado */ }
function guardar() {
  try { localStorage.setItem('truco-progreso', JSON.stringify(progreso)); } catch (e) { /* sin guardado */ }
}

let partida = 0;          // cambia cada vez que se entra o sale de un nivel
let ayuda = () => Voz.decir('inicio'); // qué pasa al tocar el parlante
let nivelActual = 1;      // un número de nivel, o 'libre' para el partido del botón Jugar

document.querySelectorAll('[data-capi]').forEach(e => { e.innerHTML = SVG_CAPI; });
document.querySelectorAll('[data-icono]').forEach(e => { e.innerHTML = e.dataset.icono === 'play' ? SVG_PLAY : icono(e.dataset.icono); });
Voz.alHablar(si => document.body.classList.toggle('hablando', si));

function mostrar(nombre) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === 'p-' + nombre));
}

// ---------- Inicio ----------
function irAInicio() {
  partida++;
  mostrar('inicio');
  ayuda = () => Voz.decir('inicio');
  Voz.decir('inicio');
}
// El navegador no deja hablar antes del primer toque: el primero que no sea en un botón
// habilita el audio y saluda. Va en 'click' porque en pantallas táctiles 'pointerdown'
// no cuenta como gesto del usuario y la voz no arranca.
let saludado = false;
$('#p-inicio').addEventListener('click', ev => {
  Voz.activar();
  if (saludado || ev.target.closest('button, a')) return;
  saludado = true;
  Voz.decir('inicio');
});

// ---------- Elegir nivel ----------
function irANiveles(saludo) {
  partida++;
  mostrar('niveles');
  const cont = $('#niveles');
  cont.innerHTML = '';
  let actual = 0; // el último nivel abierto y listo: el que toca jugar
  let total = 0;
  const botones = [];
  for (let n = 0; n <= 5; n++) {
    // Un nivel se abre con 2 estrellas en el anterior, o si ya se jugó antes
    // (para no cerrarle el nivel 1 a quien lo jugó antes de que existiera el 0).
    const abierto = n === 0 || (progreso.estrellas[n - 1] || 0) >= 2 || (progreso.estrellas[n] || 0) > 0;
    const listo = n <= NIVELES_LISTOS;
    const b = document.createElement('button');
    b.className = 'nivel' + (abierto ? '' : ' cerrado') + (abierto && !listo ? ' pronto' : '') +
      (n === 0 && !progreso.estrellas[0] ? ' sugerida' : '');
    const ganadas = progreso.estrellas[n] || 0;
    total += ganadas;
    if (abierto && listo) actual = n;
    b.setAttribute('aria-label', `Nivel ${n}` + (abierto ? (listo ? `, ${ganadas} estrellas` : ', pronto') : ', cerrado'));
    b.innerHTML =
      `<span class="nivel-num">${n}</span>` +
      `<span class="nivel-icono">${icono(abierto && !listo ? 'reloj' : ICONOS_NIVEL[n])}</span>` +
      (abierto ? '' : `<span class="nivel-candado">${icono('candado')}</span>`) +
      `<span class="nivel-estrellas">${[1, 2, 3].map(i => estrella(i <= ganadas)).join('')}</span>`;
    botones.push(b);
    b.onclick = () => {
      if (!abierto) return Voz.decir('nivel-cerrado');
      if (!listo) return Voz.decir('nivel-pronto');
      empezar(n);
    };
    cont.appendChild(b);
  }
  botones[actual].classList.add('actual');
  $('#estrellas-total').innerHTML = estrella(true) + `<span>${total}</span>`;
  $('#estrellas-total').setAttribute('aria-label', `${total} estrellas`);
  dibujarCamino(actual);
  ayuda = () => Voz.decir('elegi-juego');
  if (saludo) Voz.decir('hola', 'elegi-juego'); else Voz.decir('elegi-juego');
}

// El camino une los niveles en orden. Va pintado de amarillo hasta el que toca jugar.
let caminoHasta = 0;
function dibujarCamino(hasta = caminoHasta) {
  caminoHasta = hasta;
  if (!$('#p-niveles').classList.contains('activa')) return;
  const caja = $('.camino-caja').getBoundingClientRect();
  const pts = [...document.querySelectorAll('#niveles .nivel')].map(b => {
    const r = b.getBoundingClientRect();
    return [r.left + r.width / 2 - caja.left, r.top + r.height / 2 - caja.top];
  });
  const trazo = lista => lista.map(([x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = lista[i - 1];
    return Math.abs(py - y) > Math.abs(px - x) ? `C${px} ${(py + y) / 2} ${x} ${(py + y) / 2} ${x} ${y}` : `C${(px + x) / 2} ${py} ${(px + x) / 2} ${y} ${x} ${y}`;
  }).join(' ');
  const todo = trazo(pts), hecho = trazo(pts.slice(0, hasta + 1));
  const svg = $('#camino');
  svg.setAttribute('viewBox', `0 0 ${caja.width} ${caja.height}`);
  svg.innerHTML =
    `<path d="${todo}" class="camino-borde"/><path d="${todo}" class="camino-calle"/>` +
    (hasta > 0 ? `<path d="${hecho}" class="camino-hecho"/>` : '');
}
window.addEventListener('resize', () => dibujarCamino());

function empezar(n) {
  nivelActual = n;
  $('#btn-casa').innerHTML = icono(n === 'libre' ? 'casa' : 'mapa');
  $('#btn-casa').setAttribute('aria-label', n === 'libre' ? 'Volver al inicio' : 'Volver a los niveles');
  if (n === 'libre') return jugarLibre();
  [nivel0, nivel1, nivel2, nivel3, nivel4][n]();
}

// El partido del botón Jugar: a 15 contra Capi, sin guía armada.
function jugarLibre() {
  jugarPartida({ nivel: 'libre', meta: 15, excluir: ['mazo'], intro: 'jugar-intro', reparto: () => undefined, id: ++partida });
}

function prepararJuego({ conMano, practica = false, tabla = false }) {
  mostrar('juego');
  $('#p-juego').classList.toggle('duelo', !conMano && !tabla);
  $('#p-juego').classList.toggle('practica', practica);
  $('#p-juego').classList.toggle('tabla', tabla);
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

// ---------- Nivel 0: conocer las cartas ----------
// Escalones de la tabla, de la carta más fuerte (14) a la más bajita (1).
const ESCALONES = Array.from({ length: FUERZA_MAX }, (_, i) => FUERZA_MAX - i)
  .map(f => ({ f, cartas: MAZO.filter(c => c.f === f) }));

// Paso de los cuatro dibujitos: termina cuando tocó los cuatro. Devuelve si el nivel sigue vivo.
function pasoPalos(vivo) {
  return new Promise(ok => {
    const mesa = $('#mesa');
    mesa.innerHTML = '';
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
      mesa.appendChild(b);
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
function pasoTabla(escalones, intro, vivo, control = {}) {
  return new Promise(ok => {
    const mesa = $('#mesa');
    mesa.innerHTML = '';
    const grilla = document.createElement('div');
    grilla.className = 'grilla grilla-' + escalones.length;
    mesa.appendChild(grilla);
    let siguiente = 0;
    let ocupado = false; // mientras habla un escalón recién destapado, no se toca nada
    control.liberar = () => { ocupado = false; };
    const lugares = escalones.map((esc, k) => {
      const lugar = document.createElement('div');
      lugar.className = 'escalon' + (esc.cartas.length === 2 ? ' par' : '');
      lugar.setAttribute('role', 'button');
      lugar.setAttribute('aria-label', FRASES['tabla-' + esc.f]);
      lugar.onclick = async () => {
        if (ocupado || !vivo()) return;
        if (k < siguiente) { Voz.decir('tabla-' + esc.f); return; }
        if (k !== siguiente) return;
        ocupado = true;
        siguiente++;
        lugar.classList.remove('sugerida');
        lugar.classList.add('destapado');
        esc.cartas.forEach(c => lugar.appendChild(crearCarta(c)));
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
  prepararJuego({ conMano: false, tabla: true });

  // Paso A: qué es el truco. No se puede saltear tocando el parlante.
  const mesa = $('#mesa');
  mesa.innerHTML = '';
  barajar(MAZO).slice(0, 3).forEach(c => {
    const el = crearCarta(c, { conFuerza: false });
    el.disabled = true;
    mesa.appendChild(el);
  });
  ayuda = () => {};
  await Voz.decir('n0-intro');
  if (!vivo()) return;

  // Paso B: los cuatro dibujitos.
  if (!(await pasoPalos(vivo))) return;
  await espera(600);
  if (!vivo()) return;

  // Paso C: la tabla en dos tramos. Primero las campeonas, después el resto.
  if (!(await pasoTabla(ESCALONES.slice(0, 4), 'n0-campeonas', vivo))) return;
  ayuda = () => {};
  await Voz.decir('n0-campeonas-fin');
  if (!vivo()) return;
  await espera(800);
  if (!vivo()) return;
  const resto = {};
  if (!(await pasoTabla(ESCALONES.slice(4), 'n0-resto', vivo, resto))) return;
  resto.liberar();

  // Final: puede explorar la tabla; el botón amarillo (acción principal) termina el nivel.
  const listo = document.createElement('button');
  listo.className = 'btn-redondo sol listo';
  listo.setAttribute('aria-label', 'Seguir');
  listo.innerHTML = icono('tilde');
  listo.onclick = () => terminar(0, 3);
  $('#marcadores').appendChild(listo);
  ayuda = () => { listo.classList.add('sugerida'); Voz.decir('n0-tabla-fin'); };
  Voz.decir('n0-tabla-fin');
}

// ---------- Nivel 1: ¿qué carta gana? ----------
async function nivel1() {
  const id = ++partida;
  const vivo = () => id === partida;
  const TOTAL = 8, CON_BARRA = 5;
  const resultados = [];
  prepararJuego({ conMano: false });
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
  let ganadas = 0;
  prepararJuego({ conMano: true });
  montarMesa();
  ayuda = () => Voz.decir('n2-intro');
  pintarMarcadores(3, []);
  await Voz.decir('n2-intro');
  if (!vivo()) return;

  for (let r = 0; r < RONDAS; r++) {
    const mazo = barajar(MAZO);
    const mia = mazo.slice(0, 3), suya = mazo.slice(3, 6);
    const mano = r % 2 === 0 ? 1 : -1;
    const guiado = r === 0; // en la primera ronda Capi muestra qué carta conviene
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
        await Voz.decir('capi-jugo', delZorro.id);
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
        await Voz.decir('capi-jugo', delZorro.id);
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
      await Voz.decir(g === 1 ? 'mano-tuya' : g === -1 ? 'mano-capi' : 'parda');
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
    await Voz.decir(quien === 1 ? 'ronda-tuya' : 'ronda-capi');
    if (!vivo()) return;
  }
  terminar(2, ganadas >= 2 ? 3 : ganadas === 1 ? 2 : 1);
}

// ---------- Mesa compartida por los niveles con rival ----------
function montarMesa() {
  $('#mesa').innerHTML =
    `<div class="lugar"><div class="quien">${SVG_CAPI}</div><div class="tantos" id="tantos-zorro"></div><div class="hueco" id="hueco-zorro"></div></div>` +
    `<div class="lugar"><div class="quien yo">${SVG_NENE}</div><div class="tantos" id="tantos-yo"></div><div class="hueco" id="hueco-yo"></div></div>` +
    `<div class="cantos" id="cantos"></div>`;
}
function poner(quien, c) {
  const h = $('#hueco-' + quien);
  h.innerHTML = '';
  if (c) { h.appendChild(crearCarta(c)); Voz.sonido('carta'); }
}
function pintarTantos(puntos, meta) {
  ['yo', 'zorro'].forEach((q, k) => {
    $('#tantos-' + q).innerHTML = Array.from({ length: meta }, (_, i) => `<i class="${i < puntos[k] ? 'si' : ''}"></i>`).join('');
  });
}
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

const YO = 0, ZORRO = 1;
const BOTON_CANTO = {
  'truco': { icono: 'megafono', puntos: 2 },
  'retruco': { icono: 'megafono', puntos: 3 },
  'vale-cuatro': { icono: 'megafono', puntos: 4 },
  'envido': { icono: 'envido', esEnvido: true },
  'real-envido': { icono: 'envido', esEnvido: true },
  'quiero': { icono: 'tilde' },
  'no-quiero': { icono: 'cruz' },
};
// Cuánto vale el envido si se acepta, y cuánto gana el que cantó si no se acepta.
const envidoEnJuego = cantos => cantos.reduce((s, c) => s + Motor.VALOR_ENVIDO[c], 0);
const envidoNoQuerido = cantos => (cantos.length === 1 ? 1 : envidoEnJuego(cantos.slice(0, -1)));

// Muestra la mano y los botones de canto, y espera a que el chico elija.
function pedirAccion(e, guiado, excluir) {
  const permitidas = Motor.acciones(e).filter(a => !excluir.includes(a.tipo));
  const puedeTirar = permitidas.some(a => a.tipo === 'carta');
  const sugerida = Bot.elegir(e, () => 0, excluir);
  const rival = e.mesa[ZORRO];
  const esEnvido = !!e.envido.pendiente;
  const pista = {
    'carta': () => (!rival ? 'pista-fuerte' : sugerida.carta.f > rival.f ? 'pista-gana' : 'pista-baja'),
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
    const cantos = $('#cantos');
    cantos.innerHTML = '';
    permitidas.filter(a => a.tipo !== 'carta').forEach(a => {
      const info = BOTON_CANTO[a.tipo];
      // Los puntitos muestran cuánto pasa a valer si el otro dice quiero.
      const puntos = info.esEnvido ? envidoEnJuego([...e.envido.cantos, a.tipo]) : info.puntos;
      const b = document.createElement('button');
      b.className = 'canto canto-' + a.tipo;
      b.setAttribute('aria-label', FRASES['yo-' + a.tipo]);
      b.innerHTML = icono(info.icono) + (puntos ? `<span class="vale">${'<i></i>'.repeat(puntos)}</span>` : '');
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
  const brillos = mias.map(c => document.querySelector(`#mano [data-id="${c.id}"], #hueco-yo [data-id="${c.id}"]`)).filter(Boolean);
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
  muestra.innerHTML = `<div class="quien">${SVG_CAPI}</div>`;
  suyas.forEach(c => { const el = crearCarta(c); el.disabled = true; el.classList.add('brilla'); muestra.appendChild(el); });
  $('#cantos').appendChild(muestra);
  const delZorro = ['capi-tengo', ...frasesCuenta(suyas)];
  if (suyas.length < 2) delZorro.push('sin-par-capi');
  delZorro.push(...explicarFiguras(suyas, e.repartidas[ZORRO]));
  delZorro.push(ev.tantos[0] === ev.tantos[1] ? 'envido-empate' : ev.ganador === YO ? 'envido-tuyo' : 'envido-capi');
  if (ev.ganador === ZORRO && ev.tantos[0] !== ev.tantos[1] && !avisos.sonBuenas) { avisos.sonBuenas = true; delZorro.push('son-buenas'); }
  await Voz.decir(...delZorro);
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
      poner(mio ? 'yo' : 'zorro', ev.carta);
      if (mio) mostrarMano(e, false);
      else await Voz.decir('capi-jugo', ev.carta.id);
    } else if (ev.tipo === 'baza') {
      pintarMarcadores(3, e.bazas.map(b => (b === YO ? 1 : b === ZORRO ? -1 : 0)));
      if (ev.ganador !== Motor.PARDA) {
        $('#hueco-yo .carta').classList.add(ev.ganador === YO ? 'gana' : 'pierde');
        $('#hueco-zorro .carta').classList.add(ev.ganador === ZORRO ? 'gana' : 'pierde');
      }
      Voz.sonido(ev.ganador === YO ? 'bien' : 'casi');
      await Voz.decir(ev.ganador === YO ? 'mano-tuya' : ev.ganador === ZORRO ? 'mano-capi' : 'parda');
      if (!vivo()) return false;
      await espera(700);
      if (!vivo()) return false;
      poner('zorro', null);
      poner('yo', null);
    } else if (ev.tipo === 'canto') {
      const esEnvido = ev.canto === 'envido' || ev.canto === 'real-envido';
      if (mio) {
        // La primera vez que el chico canta truco en la partida, Capi se lo piensa en voz alta.
        const frases = ['yo-' + ev.canto];
        if (!esEnvido && !avisos.ahBueno) { avisos.ahBueno = true; frases.push('capi-ah-bueno'); }
        await Voz.decir(...frases);
      } else if (esEnvido) {
        const c = e.envido.cantos;
        await Voz.decir('capi-' + ev.canto, 'si-quiero-envido-' + envidoEnJuego(c), 'si-no-quiero-' + envidoNoQuerido(c));
      } else await Voz.decir('capi-' + ev.canto);
    } else if (ev.tipo === 'respuesta') {
      const frases = [(mio ? 'yo-' : 'capi-') + (ev.quiero ? 'quiero' : 'no-quiero')];
      if (ev.quiero && ev.canto !== 'envido') frases.push('vale-' + (e.truco.nivel + 1));
      await Voz.decir(...frases);
    } else if (ev.tipo === 'envido') {
      if (!(await mostrarEnvido(ev, e, vivo, avisos))) return false;
    } else if (ev.tipo === 'truco-en-espera') {
      await Voz.decir(mio ? 'truco-espera-tuyo' : 'truco-espera');
    } else if (ev.tipo === 'puntos') {
      pintarTantos(e.puntos, e.meta);
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
  prepararJuego({ conMano: true });
  montarMesa();
  pintarTantos(e.puntos, e.meta);
  pintarMarcadores(3, []);
  ayuda = () => Voz.decir(intro);
  await Voz.decir(intro);
  if (!vivo()) return;

  while (e.fase !== 'fin-partida') {
    const cartas = reparto(e.rondas);
    const guiado = !!cartas;
    Motor.nuevaRonda(e, cartas);
    pintarMarcadores(3, []);
    poner('zorro', null);
    poner('yo', null);
    mostrarMano(e, false);
    if (e.rondas > 1) {
      // En la tercera ronda Capi hace una pausa para tomar mate.
      await Voz.decir(...(e.rondas === 3 ? ['capi-mate', 'otra-ronda'] : ['otra-ronda']));
      if (!vivo()) return;
    }
    while (e.fase === 'jugando') {
      let accion;
      if (Motor.actor(e) === ZORRO) {
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
  prepararJuego({ conMano: false, practica: true });
  pintarMarcadores(MANOS, resultados);
  ayuda = () => Voz.decir('n4-intro');
  await Voz.decir('n4-intro');
  if (!vivo()) return false;
  let figurasDichas = false;

  for (let i = 0; i < MANOS; i++) {
    const cartas = manoPractica(i === 1);
    const par = cartas.filter(c => cartas.filter(x => x.palo === c.palo).length === 2);
    const mesa = $('#mesa');
    mesa.innerHTML = '<div class="numero-grande" id="numero"></div>';
    const els = cartas.map(c => { const el = crearCarta(c, { conFuerza: false }); mesa.appendChild(el); return el; });
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

    ayuda = () => { els.forEach((el, k) => { if (par.includes(cartas[k])) el.classList.add('sugerida'); }); Voz.decir('n4-toca-par'); };
    Voz.decir('n4-toca-par');
    for (;;) {
      const [a, b] = await elegirDos();
      if (!vivo()) return false;
      if (a.palo === b.palo) break;
      fallos++;
      Voz.sonido('casi');
      await Voz.decir('n4-no-par');
      if (!vivo()) return false;
      els.forEach(el => el.classList.remove('elegida'));
      if (fallos >= 2) ayuda();
    }
    ayuda = () => {};
    resultados.push(fallos === 0 ? 1 : -1);
    pintarMarcadores(MANOS, resultados);
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
  jugarPartida({ nivel: 4, meta: 9, excluir: ['mazo'], intro: 'n4-partida', reparto: repartoEnvido, id });
}

// ---------- Fin de nivel ----------
function terminar(n, estrellas) {
  partida++;
  progreso.estrellas[n] = Math.max(progreso.estrellas[n] || 0, estrellas);
  guardar();
  mostrar('fin');
  $('#estrellas').innerHTML = [1, 2, 3].map(i => estrella(i <= estrellas).replace('<svg ', `<svg style="animation-delay:${i * 0.25}s" `)).join('');
  // Desde el partido libre se vuelve al inicio; desde un nivel, al camino de niveles.
  const libre = n === 'libre';
  $('#btn-fin-casa').innerHTML = icono(libre ? 'casa' : 'mapa');
  $('#btn-fin-casa').setAttribute('aria-label', libre ? 'Volver al inicio' : 'Volver a los niveles');
  $('#etiqueta-fin-casa').textContent = libre ? 'Inicio' : 'Niveles';
  Voz.sonido('estrella');
  const frases = ['estrellas-' + estrellas, estrellas >= 2 ? 'fin-bien' : 'fin-otra'];
  ayuda = () => Voz.decir(...frases);
  Voz.decir(...frases);
}

// ---------- Botones fijos ----------
const volver = () => (nivelActual === 'libre' ? irAInicio() : irANiveles(false));
$('#btn-aprender').onclick = () => { Voz.activar(); saludado = true; irANiveles(true); };
$('#btn-jugar').onclick = () => { Voz.activar(); saludado = true; empezar('libre'); };
$('#btn-niveles-casa').onclick = () => irAInicio();
$('#btn-casa').onclick = volver;
$('#btn-fin-casa').onclick = volver;
$('#btn-otra').onclick = () => empezar(nivelActual);
document.querySelectorAll('.oir').forEach(b => { b.onclick = () => { Voz.activar(); saludado = true; ayuda(); }; });

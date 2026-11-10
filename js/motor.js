// Motor de reglas del Truco (dos jugadores, sin flor ni falta envido).
// No sabe nada de pantalla ni de voz: recibe acciones y devuelve eventos.
//
//   const e = Motor.nuevaPartida({ meta: 15 });
//   Motor.nuevaRonda(e);
//   Motor.actor(e)            -> a quién le toca (0 o 1)
//   Motor.acciones(e)         -> acciones permitidas para ese jugador
//   Motor.aplicar(e, accion)  -> lista de eventos de lo que pasó
//
// Acciones: { tipo: 'carta', carta } | 'truco' | 'retruco' | 'vale-cuatro'
//           | 'envido' | 'real-envido' | 'quiero' | 'no-quiero' | 'mazo'
const Motor = (() => {
  const enNode = typeof module !== 'undefined' && module.exports;
  const dep = enNode ? require('./mazo.js') : { MAZO: MAZO, barajar: barajar };

  const PARDA = -1;
  const CANTOS_TRUCO = ['truco', 'retruco', 'vale-cuatro'];
  const VALOR_RONDA = [1, 2, 3, 4];           // según hasta dónde se aceptó el truco
  const VALOR_ENVIDO = { 'envido': 2, 'real-envido': 3 };

  // Tantos para el envido: dos del mismo palo suman 20 más sus números; las figuras valen 0.
  function tantos(cartas) {
    const v = c => (c.n >= 10 ? 0 : c.n);
    let mejor = Math.max(...cartas.map(v));
    for (let i = 0; i < cartas.length; i++) {
      for (let j = i + 1; j < cartas.length; j++) {
        if (cartas[i].palo === cartas[j].palo) mejor = Math.max(mejor, 20 + v(cartas[i]) + v(cartas[j]));
      }
    }
    return mejor;
  }

  // bazas: quién ganó cada una (0, 1 o PARDA). Devuelve el ganador de la ronda o null si sigue.
  function ganadorRonda(bazas, mano) {
    const [a, b, c] = bazas;
    if (bazas.length >= 2) {
      if (a !== PARDA && a === b) return a;
      if (a === PARDA && b !== PARDA) return b;
      if (a !== PARDA && b === PARDA) return a;
    }
    if (bazas.length === 3) {
      if (c !== PARDA) return c;
      if (a !== PARDA) return a;
      return mano;
    }
    return null;
  }

  function nuevaPartida({ meta = 15, mano = 0, rng = Math.random } = {}) {
    return { meta, rng, puntos: [0, 0], mano, rondas: 0, fase: 'entre-rondas', ganador: null };
  }

  // cartas: opcional, [[3 cartas], [3 cartas]] para repartir a mano (pruebas y niveles guiados).
  function nuevaRonda(e, cartas) {
    if (e.fase === 'fin-partida') throw new Error('La partida ya terminó');
    if (e.rondas > 0) e.mano = 1 - e.mano;
    e.rondas++;
    if (!cartas) {
      const m = dep.barajar(dep.MAZO, e.rng);
      cartas = [m.slice(0, 3), m.slice(3, 6)];
    }
    e.manos = cartas.map(c => c.slice());
    e.repartidas = cartas.map(c => c.slice());
    e.bazas = [];
    e.mesa = [null, null];
    e.turno = e.mano;
    // nivel: 0 nada, 1 truco, 2 retruco, 3 vale cuatro (ya aceptado).
    // puede: quién puede subir la apuesta (null = cualquiera).
    e.truco = { nivel: 0, pendiente: null, puede: null };
    e.envido = { cantos: [], pendiente: null, cerrado: false };
    e.fase = 'jugando';
    return e;
  }

  function actor(e) {
    if (e.fase !== 'jugando') return null;
    if (e.envido.pendiente) return 1 - e.envido.pendiente.de;
    if (e.truco.pendiente) return 1 - e.truco.pendiente.de;
    return e.turno;
  }

  // El envido solo se canta en la primera baza, antes de jugar la carta propia
  // y antes de que haya un truco aceptado.
  function puedeEnvido(e, j) {
    return !e.envido.cerrado && e.envido.cantos.length === 0 && e.bazas.length === 0 &&
      e.mesa[j] === null && e.truco.nivel === 0;
  }

  function acciones(e) {
    const j = actor(e);
    if (j === null) return [];
    const a = [];
    if (e.envido.pendiente) {
      a.push({ tipo: 'quiero' }, { tipo: 'no-quiero' });
      const c = e.envido.cantos;
      if (c.length === 1 && c[0] === 'envido') a.push({ tipo: 'envido' });
      if (!c.includes('real-envido')) a.push({ tipo: 'real-envido' });
      return a;
    }
    if (e.truco.pendiente) {
      a.push({ tipo: 'quiero' }, { tipo: 'no-quiero' });
      if (e.truco.pendiente.nivel < 3) a.push({ tipo: CANTOS_TRUCO[e.truco.pendiente.nivel] });
      // "El envido está primero"
      if (puedeEnvido(e, j)) a.push({ tipo: 'envido' }, { tipo: 'real-envido' });
      return a;
    }
    for (const carta of e.manos[j]) a.push({ tipo: 'carta', carta });
    if (e.truco.nivel < 3 && (e.truco.puede === null || e.truco.puede === j)) a.push({ tipo: CANTOS_TRUCO[e.truco.nivel] });
    if (puedeEnvido(e, j)) a.push({ tipo: 'envido' }, { tipo: 'real-envido' });
    a.push({ tipo: 'mazo' });
    return a;
  }

  function aplicar(e, accion) {
    const j = actor(e);
    const permitida = acciones(e).some(a => a.tipo === accion.tipo && (a.tipo !== 'carta' || a.carta.id === accion.carta.id));
    if (!permitida) throw new Error(`Acción no permitida: ${accion.tipo}`);
    const ev = [];

    const sumar = (quien, puntos, motivo) => {
      if (e.fase === 'fin-partida') return;
      e.puntos[quien] = Math.min(e.meta, e.puntos[quien] + puntos);
      ev.push({ tipo: 'puntos', jugador: quien, puntos, motivo });
      if (e.puntos[quien] >= e.meta) {
        e.fase = 'fin-partida';
        e.ganador = quien;
      }
    };
    const cerrarRonda = ganador => {
      ev.push({ tipo: 'fin-ronda', ganador });
      if (e.fase === 'fin-partida') ev.push({ tipo: 'fin-partida', ganador: e.ganador });
      else e.fase = 'entre-rondas';
    };

    const t = accion.tipo;

    if (t === 'envido' || t === 'real-envido') {
      e.truco.pendiente = null; // si había un truco sin contestar, queda para después
      e.envido.cantos.push(t);
      e.envido.pendiente = { de: j };
      ev.push({ tipo: 'canto', jugador: j, canto: t });

    } else if (e.envido.pendiente) { // quiero / no-quiero al envido
      const cantos = e.envido.cantos;
      const quienCanto = e.envido.pendiente.de;
      e.envido.pendiente = null;
      e.envido.cerrado = true;
      ev.push({ tipo: 'respuesta', jugador: j, canto: 'envido', quiero: t === 'quiero' });
      if (t === 'quiero') {
        const pts = cantos.reduce((s, c) => s + VALOR_ENVIDO[c], 0);
        const tt = e.repartidas.map(tantos);
        const gana = tt[0] === tt[1] ? e.mano : (tt[0] > tt[1] ? 0 : 1);
        ev.push({ tipo: 'envido', tantos: tt, ganador: gana });
        sumar(gana, pts, 'envido');
      } else {
        const pts = cantos.length === 1 ? 1 : cantos.slice(0, -1).reduce((s, c) => s + VALOR_ENVIDO[c], 0);
        sumar(quienCanto, pts, 'envido-no-querido');
      }
      if (e.fase === 'fin-partida') ev.push({ tipo: 'fin-partida', ganador: e.ganador });

    } else if (CANTOS_TRUCO.includes(t)) {
      // Subir como respuesta acepta el canto anterior.
      if (e.truco.pendiente) e.truco.nivel = e.truco.pendiente.nivel;
      e.truco.pendiente = { de: j, nivel: e.truco.nivel + 1 };
      ev.push({ tipo: 'canto', jugador: j, canto: t });

    } else if (e.truco.pendiente) { // quiero / no-quiero al truco
      const p = e.truco.pendiente;
      e.truco.pendiente = null;
      ev.push({ tipo: 'respuesta', jugador: j, canto: CANTOS_TRUCO[p.nivel - 1], quiero: t === 'quiero' });
      if (t === 'quiero') {
        e.truco.nivel = p.nivel;
        e.truco.puede = j;
      } else {
        sumar(p.de, p.nivel, 'truco-no-querido');
        cerrarRonda(p.de);
      }

    } else if (t === 'mazo') {
      ev.push({ tipo: 'mazo', jugador: j });
      sumar(1 - j, VALOR_RONDA[e.truco.nivel], 'mazo');
      cerrarRonda(1 - j);

    } else { // carta
      const i = e.manos[j].findIndex(c => c.id === accion.carta.id);
      const carta = e.manos[j].splice(i, 1)[0];
      e.mesa[j] = carta;
      ev.push({ tipo: 'carta', jugador: j, carta });
      if (e.mesa[0] && e.mesa[1]) {
        const [c0, c1] = e.mesa;
        const g = c0.f === c1.f ? PARDA : (c0.f > c1.f ? 0 : 1);
        e.bazas.push(g);
        e.ultimaBaza = { cartas: [c0, c1], ganador: g };
        e.mesa = [null, null];
        ev.push({ tipo: 'baza', ganador: g, cartas: [c0, c1] });
        const gr = ganadorRonda(e.bazas, e.mano);
        if (gr !== null) {
          sumar(gr, VALOR_RONDA[e.truco.nivel], 'ronda');
          cerrarRonda(gr);
        } else {
          e.turno = g === PARDA ? e.mano : g; // después de una parda sale el mano
        }
      } else {
        e.turno = 1 - j;
      }
    }
    return ev;
  }

  return { PARDA, CANTOS_TRUCO, tantos, ganadorRonda, nuevaPartida, nuevaRonda, actor, acciones, aplicar };
})();

if (typeof module !== 'undefined') module.exports = Motor;

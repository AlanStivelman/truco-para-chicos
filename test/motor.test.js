const test = require('node:test');
const assert = require('node:assert/strict');
const { MAZO, fuerza } = require('../js/mazo.js');
const Motor = require('../js/motor.js');
const Bot = require('../js/bot.js');

const c = (n, palo) => MAZO.find(x => x.n === n && x.palo === palo);
const P = Motor.PARDA;

// Generador de azar con semilla, para que las pruebas den siempre lo mismo.
function azar(semilla) {
  let a = semilla;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ronda(cartas0, cartas1, opciones) {
  const e = Motor.nuevaPartida(opciones);
  Motor.nuevaRonda(e, [cartas0, cartas1]);
  return e;
}
const jugar = (e, ...acciones) => acciones.flatMap(a => Motor.aplicar(e, typeof a === 'string' ? { tipo: a } : { tipo: 'carta', carta: a }));
const tipos = e => Motor.acciones(e).map(a => a.tipo);

test('orden de las cartas', () => {
  const orden = [[1, 'espada'], [1, 'basto'], [7, 'espada'], [7, 'oro'], [3, 'copa'], [2, 'oro'], [1, 'copa'],
    [12, 'basto'], [11, 'oro'], [10, 'copa'], [7, 'basto'], [6, 'oro'], [5, 'espada'], [4, 'copa']];
  for (let i = 1; i < orden.length; i++) assert.ok(fuerza(...orden[i - 1]) > fuerza(...orden[i]), `${orden[i - 1]} > ${orden[i]}`);
  assert.equal(fuerza(3, 'oro'), fuerza(3, 'espada'));
  assert.equal(fuerza(1, 'oro'), fuerza(1, 'copa'));
  assert.equal(fuerza(7, 'copa'), fuerza(7, 'basto'));
  assert.equal(MAZO.length, 40);
});

test('tantos del envido', () => {
  assert.equal(Motor.tantos([c(7, 'espada'), c(6, 'espada'), c(1, 'oro')]), 33);
  assert.equal(Motor.tantos([c(12, 'copa'), c(11, 'copa'), c(5, 'oro')]), 20);
  assert.equal(Motor.tantos([c(12, 'copa'), c(4, 'copa'), c(7, 'oro')]), 24);
  assert.equal(Motor.tantos([c(7, 'copa'), c(5, 'oro'), c(12, 'basto')]), 7);
  assert.equal(Motor.tantos([c(2, 'oro'), c(5, 'oro'), c(7, 'oro')]), 32);
});

test('quién gana la ronda', () => {
  assert.equal(Motor.ganadorRonda([0], 0), null);
  assert.equal(Motor.ganadorRonda([0, 0], 1), 0);
  assert.equal(Motor.ganadorRonda([0, 1], 0), null);
  assert.equal(Motor.ganadorRonda([0, 1, 1], 0), 1);
  assert.equal(Motor.ganadorRonda([P, 1], 0), 1);       // parda la primera: define la segunda
  assert.equal(Motor.ganadorRonda([1, P], 0), 1);       // parda la segunda: gana el de la primera
  assert.equal(Motor.ganadorRonda([0, 1, P], 1), 0);    // parda la tercera: gana el de la primera
  assert.equal(Motor.ganadorRonda([P, P], 0), null);
  assert.equal(Motor.ganadorRonda([P, P, 1], 0), 1);
  assert.equal(Motor.ganadorRonda([P, P, P], 1), 1);    // todo parda: gana el mano
});

test('ronda sin cantos vale un punto', () => {
  const e = ronda([c(1, 'espada'), c(7, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'basto'), c(6, 'copa')]);
  const ev = jugar(e, c(1, 'espada'), c(5, 'basto'), c(7, 'espada'), c(6, 'copa'));
  assert.deepEqual(e.puntos, [1, 0]);
  assert.equal(e.fase, 'entre-rondas');
  assert.ok(ev.some(x => x.tipo === 'fin-ronda' && x.ganador === 0));
});

test('el que gana la baza sale en la siguiente; tras una parda sale el mano', () => {
  const e = ronda([c(4, 'copa'), c(3, 'espada'), c(5, 'oro')], [c(1, 'espada'), c(3, 'oro'), c(6, 'copa')]);
  jugar(e, c(4, 'copa'), c(1, 'espada'));
  assert.equal(Motor.actor(e), 1);
  jugar(e, c(3, 'oro'), c(3, 'espada'));
  assert.deepEqual(e.bazas, [1, P]);
  assert.deepEqual(e.puntos, [0, 1]); // parda en la segunda: gana quien ganó la primera
});

test('truco querido vale 2, retruco 3, vale cuatro 4', () => {
  const e = ronda([c(1, 'espada'), c(7, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'basto'), c(6, 'copa')]);
  jugar(e, 'truco');
  assert.equal(Motor.actor(e), 1);
  jugar(e, 'retruco');           // subir acepta el truco
  assert.equal(Motor.actor(e), 0);
  jugar(e, 'vale-cuatro', 'quiero');
  assert.equal(e.truco.nivel, 3);
  assert.equal(Motor.actor(e), 0); // vuelve a jugar el que tenía el turno
  jugar(e, c(1, 'espada'), c(5, 'basto'), c(7, 'espada'), c(6, 'copa'));
  assert.deepEqual(e.puntos, [4, 0]);
});

test('truco no querido da un punto y termina la ronda', () => {
  const e = ronda([c(1, 'espada'), c(7, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'basto'), c(6, 'copa')]);
  jugar(e, 'truco', 'no-quiero');
  assert.deepEqual(e.puntos, [1, 0]);
  assert.equal(e.fase, 'entre-rondas');
});

test('retruco no querido da dos puntos', () => {
  const e = ronda([c(1, 'espada'), c(7, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'basto'), c(6, 'copa')]);
  jugar(e, 'truco', 'retruco', 'no-quiero');
  assert.deepEqual(e.puntos, [0, 2]);
});

test('solo el que aceptó el truco puede cantar retruco', () => {
  const e = ronda([c(1, 'espada'), c(7, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'basto'), c(6, 'copa')]);
  jugar(e, 'truco', 'quiero');
  assert.equal(Motor.actor(e), 0);
  assert.ok(!tipos(e).includes('retruco'));
  jugar(e, c(4, 'copa'));
  assert.ok(tipos(e).includes('retruco'));
});

test('envido querido: gana el de más tantos; si empatan, el mano', () => {
  const e = ronda([c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]);
  const ev = jugar(e, 'envido', 'quiero');
  assert.deepEqual(ev.find(x => x.tipo === 'envido').tantos, [33, 28]);
  assert.deepEqual(e.puntos, [2, 0]);
  assert.equal(Motor.actor(e), 0); // sigue la ronda

  const emp = ronda([c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(7, 'oro'), c(6, 'oro'), c(4, 'basto')], { mano: 1 });
  jugar(emp, 'envido', 'quiero');
  assert.deepEqual(emp.puntos, [0, 2]);
});

test('puntos del envido según la cadena de cantos', () => {
  const manos = () => [[c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]];
  let e = ronda(...manos()); jugar(e, 'envido', 'no-quiero');
  assert.deepEqual(e.puntos, [1, 0]);
  e = ronda(...manos()); jugar(e, 'envido', 'envido', 'quiero');
  assert.deepEqual(e.puntos, [4, 0]);
  e = ronda(...manos()); jugar(e, 'envido', 'envido', 'real-envido', 'quiero');
  assert.deepEqual(e.puntos, [7, 0]);
  e = ronda(...manos()); jugar(e, 'envido', 'real-envido', 'no-quiero');
  assert.deepEqual(e.puntos, [0, 2]); // cobra el que subió
  e = ronda(...manos()); jugar(e, 'real-envido', 'quiero');
  assert.deepEqual(e.puntos, [3, 0]);
  e = ronda(...manos()); jugar(e, 'envido', 'envido', 'no-quiero');
  assert.deepEqual(e.puntos, [0, 2]);
});

test('el envido solo se puede cantar en la primera baza y antes de tirar', () => {
  const e = ronda([c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]);
  assert.ok(tipos(e).includes('envido'));
  jugar(e, c(4, 'copa'));
  assert.ok(tipos(e).includes('envido'));   // el otro todavía no tiró
  jugar(e, c(6, 'copa'));
  assert.ok(!tipos(e).includes('envido'));  // ya pasó la primera baza
});

const manosEnvido = () => [[c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]];

test('el envido está primero: después del envido querido, el truco sigue esperando respuesta', () => {
  const e = ronda(...manosEnvido());
  jugar(e, 'truco');
  assert.ok(tipos(e).includes('envido'));
  jugar(e, 'envido');
  assert.equal(Motor.actor(e), 0); // contesta el envido el que cantó truco
  const ev = jugar(e, 'quiero');
  assert.deepEqual(e.puntos, [2, 0]);
  assert.deepEqual(ev.at(-1), { tipo: 'truco-en-espera', jugador: 0, canto: 'truco' });
  assert.equal(Motor.actor(e), 1); // vuelve a contestar el truco quien lo recibió
  assert.deepEqual(tipos(e).sort(), ['no-quiero', 'quiero', 'retruco']);
});

test('el truco sigue esperando también después de un envido no querido', () => {
  const e = ronda(...manosEnvido());
  jugar(e, 'truco', 'envido', 'no-quiero');
  assert.deepEqual(e.puntos, [0, 1]);
  assert.equal(Motor.actor(e), 1);
  assert.equal(e.truco.pendiente.nivel, 1);
});

test('el truco sigue esperando aunque el envido se suba', () => {
  let e = ronda(...manosEnvido());
  jugar(e, 'truco', 'envido', 'real-envido', 'quiero');
  assert.deepEqual(e.puntos, [5, 0]);
  assert.equal(e.truco.pendiente.de, 0);
  assert.equal(Motor.actor(e), 1);
  e = ronda(...manosEnvido());
  jugar(e, 'truco', 'envido', 'envido', 'quiero');
  assert.deepEqual(e.puntos, [4, 0]);
  assert.equal(e.truco.pendiente.de, 0);
});

test('truco, envido, quiero y retruco como respuesta: la ronda vale 3', () => {
  const e = ronda(...manosEnvido());
  jugar(e, 'truco', 'envido', 'quiero', 'retruco');
  assert.equal(e.truco.nivel, 1);
  assert.equal(Motor.actor(e), 0);
  const ev = jugar(e, 'quiero', c(7, 'espada'), c(3, 'oro'), c(6, 'espada'), c(5, 'oro'));
  assert.ok(ev.some(x => x.tipo === 'puntos' && x.motivo === 'ronda' && x.jugador === 0 && x.puntos === 3));
  assert.deepEqual(e.puntos, [5, 0]);
});

test('truco, envido, quiero y no quiero al truco: envido más un punto', () => {
  const e = ronda(...manosEnvido());
  const ev = jugar(e, 'truco', 'envido', 'quiero', 'no-quiero');
  assert.deepEqual(e.puntos, [3, 0]);
  assert.ok(ev.some(x => x.tipo === 'fin-ronda' && x.ganador === 0));
});

test('el envido que termina la partida no deja un truco en espera', () => {
  for (const respuesta of ['quiero', 'no-quiero']) {
    const e = Motor.nuevaPartida({ meta: 9 });
    e.puntos = [8, 8];
    Motor.nuevaRonda(e, manosEnvido());
    const quien = respuesta === 'quiero' ? 0 : 1;
    const ev = jugar(e, 'truco', 'envido', respuesta);
    assert.equal(e.fase, 'fin-partida');
    assert.equal(e.ganador, quien);
    assert.equal(Motor.actor(e), null);
    assert.ok(!ev.some(x => x.tipo === 'truco-en-espera'));
    assert.deepEqual(Motor.acciones(e), []);
  }
});

test('las cartas de los tantos', () => {
  const ids = cs => cs.map(x => x.id).sort();
  assert.deepEqual(ids(Motor.cartasTantos([c(7, 'espada'), c(6, 'espada'), c(1, 'oro')])), ['c-6-espada', 'c-7-espada']);
  assert.deepEqual(ids(Motor.cartasTantos([c(2, 'oro'), c(5, 'oro'), c(7, 'oro')])), ['c-5-oro', 'c-7-oro']);
  assert.equal(Motor.cartasTantos([c(12, 'copa'), c(11, 'copa'), c(5, 'oro')]).length, 2);
  assert.deepEqual(ids(Motor.cartasTantos([c(7, 'copa'), c(5, 'oro'), c(12, 'basto')])), ['c-7-copa']);
  assert.equal(Motor.cartasTantos([c(12, 'copa'), c(11, 'oro'), c(10, 'basto')]).length, 1);
});

test('el evento del envido trae las cartas coherentes con los tantos', () => {
  const e = ronda(...manosEnvido());
  const ev = jugar(e, 'envido', 'quiero').find(x => x.tipo === 'envido');
  assert.deepEqual(ev.tantos, [33, 28]);
  ev.cartas.forEach((cs, k) => assert.equal(Motor.tantos(cs), ev.tantos[k]));
});

test('con el truco restaurado el bot no vuelve a cantar envido', () => {
  const e = ronda(...manosEnvido());
  jugar(e, 'truco', 'envido', 'quiero');
  for (let i = 0; i < 20; i++) {
    const a = Bot.elegir(e, Math.random, ['mazo']);
    assert.ok(['quiero', 'no-quiero', 'retruco'].includes(a.tipo), a.tipo);
  }
});

test('con truco aceptado ya no hay envido', () => {
  const e = ronda([c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]);
  jugar(e, 'truco', 'quiero');
  assert.ok(!tipos(e).includes('envido'));
});

test('irse al mazo le da los puntos al otro', () => {
  const e = ronda([c(4, 'espada'), c(5, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]);
  jugar(e, 'truco', 'quiero', 'mazo');
  assert.deepEqual(e.puntos, [0, 2]);
});

test('una acción no permitida da error', () => {
  const e = ronda([c(4, 'espada'), c(5, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]);
  assert.throws(() => jugar(e, 'quiero'));
  assert.throws(() => jugar(e, 'retruco'));
  assert.throws(() => jugar(e, c(3, 'oro'))); // carta del otro jugador
});

test('el envido puede terminar la partida en el momento', () => {
  const e = Motor.nuevaPartida({ meta: 15 });
  e.puntos = [14, 14];
  Motor.nuevaRonda(e, [[c(7, 'espada'), c(6, 'espada'), c(4, 'copa')], [c(3, 'oro'), c(5, 'oro'), c(6, 'copa')]]);
  const ev = jugar(e, 'envido', 'quiero');
  assert.equal(e.fase, 'fin-partida');
  assert.equal(e.ganador, 0);
  assert.deepEqual(e.puntos, [15, 14]);
  assert.equal(Motor.actor(e), null);
  assert.ok(ev.some(x => x.tipo === 'fin-partida'));
});

test('el mano cambia en cada ronda', () => {
  const e = Motor.nuevaPartida();
  Motor.nuevaRonda(e);
  assert.equal(e.mano, 0);
  jugar(e, 'mazo');
  Motor.nuevaRonda(e);
  assert.equal(e.mano, 1);
  assert.equal(Motor.actor(e), 1);
});

test('500 partidas completas entre dos bots terminan bien', () => {
  const rng = azar(2026);
  const victorias = [0, 0];
  for (let p = 0; p < 500; p++) {
    const e = Motor.nuevaPartida({ meta: 15, rng, mano: p % 2 });
    let rondas = 0;
    while (e.fase !== 'fin-partida') {
      Motor.nuevaRonda(e);
      assert.ok(++rondas < 100, 'demasiadas rondas');
      let pasos = 0;
      while (e.fase === 'jugando') {
        assert.ok(++pasos < 40, 'demasiados pasos en una ronda');
        Motor.aplicar(e, Bot.elegir(e, rng));
      }
      assert.ok(e.manos[0].length + e.manos[1].length <= 6);
    }
    assert.equal(e.puntos[e.ganador], 15);
    assert.ok(e.puntos[1 - e.ganador] < 15);
    victorias[e.ganador]++;
  }
  // Los dos bots juegan igual: ninguno debería ganar casi siempre.
  assert.ok(victorias[0] > 150 && victorias[1] > 150, `victorias: ${victorias}`);
});

test('300 partidas con la configuración del nivel 4 (a 9, sin mazo)', () => {
  const rng = azar(44);
  for (let p = 0; p < 300; p++) {
    const e = Motor.nuevaPartida({ meta: 9, rng, mano: p % 2 });
    while (e.fase !== 'fin-partida') {
      Motor.nuevaRonda(e);
      let pasos = 0;
      while (e.fase === 'jugando') {
        assert.ok(++pasos < 40);
        const a = Bot.elegir(e, rng, ['mazo']);
        assert.notEqual(a.tipo, 'mazo');
        Motor.aplicar(e, a);
      }
    }
    assert.equal(e.puntos[e.ganador], 9);
  }
});

test('el bot respeta las acciones excluidas del nivel', () => {
  const rng = azar(7);
  const excluir = ['envido', 'real-envido', 'mazo'];
  for (let p = 0; p < 100; p++) {
    const e = Motor.nuevaPartida({ meta: 6, rng });
    while (e.fase !== 'fin-partida') {
      Motor.nuevaRonda(e);
      while (e.fase === 'jugando') {
        const a = Bot.elegir(e, rng, excluir);
        assert.ok(!excluir.includes(a.tipo));
        Motor.aplicar(e, a);
      }
    }
  }
});

// Todas las frases que dice el juego. Cada una tiene un id: si existe una
// grabación audio/<id>.mp3 (listada en audio/manifest.json) se usa esa;
// si no, la lee la voz del dispositivo.
const FRASES = {
  'hola': '¡Hola! Soy el carpincho. Vamos a aprender a jugar al truco.',
  'elegi-juego': 'Tocá un juego para empezar.',
  'nivel-cerrado': 'Ese juego todavía está cerrado. Primero jugá el anterior.',
  'nivel-pronto': 'Ese juego todavía se está armando. ¡Pronto vas a poder jugarlo!',

  // Nivel 1: qué carta gana
  'n1-intro': 'Vamos a ver qué carta es más fuerte. Mirá la barrita amarilla: la más larga gana.',
  'n1-pregunta': '¿Cuál gana? Tocala.',
  'n1-sin-barra': '¡Muy bien! Ahora sin la barrita. Vos podés.',
  'muy-bien': '¡Muy bien!',
  'gana': 'Gana',
  'casi': 'Casi.',
  'mas-fuerte-es': 'La más fuerte es',

  // Nivel 2: ganar la ronda
  'n2-intro': 'Ahora jugamos contra el zorro. Cada uno tiene tres cartas. El que gana dos veces, gana la ronda.',
  'te-toca': 'Te toca. Tocá una carta.',
  'zorro-jugo': 'El zorro jugó',
  'pista-fuerte': 'Te toca. Empezá con tu carta más fuerte.',
  'pista-gana': 'Te toca. Esta carta le gana a la del zorro.',
  'pista-baja': 'A esa no le podés ganar. Tirá tu carta más bajita.',
  'mano-tuya': '¡Esa la ganaste vos!',
  'mano-zorro': 'Esa la ganó el zorro.',
  'parda': 'Empataron. Eso se llama parda.',
  'ronda-tuya': '¡Ganaste la ronda!',
  'ronda-zorro': 'Esta ronda la ganó el zorro. No pasa nada.',
  'otra-ronda': 'Vamos con otra ronda.',

  // Nivel 3: el truco
  'n3-intro': 'Hoy aprendemos el truco. Jugamos hasta seis puntos. Si tenés cartas fuertes, tocá el megáfono para cantar truco, y la ronda vale más.',
  'yo-truco': '¡Truco!',
  'yo-retruco': '¡Quiero retruco!',
  'yo-vale-cuatro': '¡Quiero vale cuatro!',
  'yo-quiero': '¡Quiero!',
  'yo-no-quiero': 'No quiero.',
  'zorro-truco': 'El zorro cantó truco. Si decís quiero, la ronda vale dos puntos. Si decís no quiero, el zorro gana un punto.',
  'zorro-retruco': 'El zorro cantó retruco. Si decís quiero, la ronda vale tres puntos. Si decís no quiero, el zorro gana dos.',
  'zorro-vale-cuatro': 'El zorro cantó vale cuatro. Si decís quiero, la ronda vale cuatro puntos. Si decís no quiero, el zorro gana tres.',
  'zorro-quiero': 'El zorro dijo: quiero.',
  'zorro-no-quiero': 'El zorro dijo: no quiero.',
  'vale-2': 'Ahora la ronda vale dos puntos.',
  'vale-3': 'Ahora la ronda vale tres puntos.',
  'vale-4': 'Ahora la ronda vale cuatro puntos.',
  'pista-truco': 'Tenés cartas muy fuertes. ¡Tocá el megáfono y cantá truco!',
  'pista-subir': 'Tenés cartas muy fuertes. ¡Tocá el megáfono y subí la apuesta!',
  'pista-quiero': 'Tenés buenas cartas. Tocá el pulgar para arriba y decí quiero.',
  'pista-no-quiero': 'Tus cartas son bajitas. Mejor tocá el pulgar para abajo y decí no quiero.',
  'ganaste-1': '¡Ganaste un punto!',
  'ganaste-2': '¡Ganaste dos puntos!',
  'ganaste-3': '¡Ganaste tres puntos!',
  'ganaste-4': '¡Ganaste cuatro puntos!',
  'zorro-gano-1': 'El zorro ganó un punto.',
  'zorro-gano-2': 'El zorro ganó dos puntos.',
  'zorro-gano-3': 'El zorro ganó tres puntos.',
  'zorro-gano-4': 'El zorro ganó cuatro puntos.',
  'partida-tuya': '¡Ganaste la partida!',
  'partida-zorro': 'Esta vez ganó el zorro. ¡La próxima le ganás!',

  // Nivel 4: el envido
  'n4-intro': 'Hoy aprendemos el envido. En el envido gana el que tiene más tantos. Para tener muchos tantos, hacen falta dos cartas con el mismo dibujito.',
  'n4-toca-par': 'Tocá las dos cartas que tienen el mismo dibujito.',
  'n4-no-par': 'Esas no tienen el mismo dibujito. Mirá bien los dibujitos.',
  'n4-par-bien': '¡Muy bien! Tienen el mismo dibujito. Contamos los tantos:',
  'figuras-cero': 'El diez, el once y el doce valen cero.',
  'veinte': 'Veinte',
  'mas': 'más',
  'son': 'son',
  'n4-partida': 'Ahora jugamos contra el zorro hasta nueve puntos. Si tenés muchos tantos, tocá el botón del más para cantar envido.',
  'yo-envido': '¡Envido!',
  'yo-real-envido': '¡Real envido!',
  'zorro-envido': 'El zorro cantó envido.',
  'zorro-real-envido': 'El zorro cantó real envido.',
  'si-quiero-envido-2': 'Si decís quiero, el que tiene más tantos gana dos puntos.',
  'si-quiero-envido-3': 'Si decís quiero, el que tiene más tantos gana tres puntos.',
  'si-quiero-envido-4': 'Si decís quiero, el que tiene más tantos gana cuatro puntos.',
  'si-quiero-envido-5': 'Si decís quiero, el que tiene más tantos gana cinco puntos.',
  'si-quiero-envido-7': 'Si decís quiero, el que tiene más tantos gana siete puntos.',
  'si-no-quiero-1': 'Si decís no quiero, el zorro gana un punto.',
  'si-no-quiero-2': 'Si decís no quiero, el zorro gana dos puntos.',
  'si-no-quiero-4': 'Si decís no quiero, el zorro gana cuatro puntos.',
  'vos-tenes': 'Vos tenés',
  'zorro-tiene': 'El zorro tiene',
  'sin-par-yo': 'No tenés dos cartas con el mismo dibujito, así que vale tu carta más alta.',
  'sin-par-zorro': 'El zorro no tiene dos cartas con el mismo dibujito, así que vale su carta más alta.',
  'envido-tuyo': '¡Ganaste el envido!',
  'envido-zorro': 'El envido lo ganó el zorro.',
  'envido-empate': 'Empataron. Cuando empatan, gana el que empezó la ronda.',
  'truco-espera': 'Ahora sí: el zorro había cantado truco. ¿Querés o no querés?',
  'truco-espera-tuyo': 'Ahora el zorro tiene que contestar tu truco.',
  'pista-envido': 'Tenés muchos tantos. ¡Tocá el botón del más y cantá envido!',
  'pista-real-envido': 'Tenés muchísimos tantos. ¡Tocá el botón del más y subí a real envido!',
  'pista-quiero-envido': 'Tenés muchos tantos. Tocá el pulgar para arriba y decí quiero.',
  'pista-no-quiero-envido': 'Tenés pocos tantos. Mejor tocá el pulgar para abajo y decí no quiero.',
  'ganaste-5': '¡Ganaste cinco puntos!',
  'ganaste-7': '¡Ganaste siete puntos!',
  'zorro-gano-5': 'El zorro ganó cinco puntos.',
  'zorro-gano-7': 'El zorro ganó siete puntos.',

  // Final
  'estrellas-1': 'Ganaste una estrella.',
  'estrellas-2': '¡Ganaste dos estrellas!',
  'estrellas-3': '¡Ganaste tres estrellas!',
  'fin-bien': '¡Qué bien jugaste!',
  'fin-otra': '¿Jugamos otra vez?',
};

// Números de los tantos: 0 a 7 y 20 a 33. Ids 'num-<n>'.
for (let n = 0; n <= 33; n++) if (n <= 7 || n >= 20) FRASES['num-' + n] = String(n);

// Nombres de las 40 cartas: ids 'c-<numero>-<palo>'
(() => {
  const nombres = { 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 10: 'diez', 11: 'once', 12: 'doce' };
  for (const palo of ['espada', 'basto', 'oro', 'copa']) {
    for (const n in nombres) FRASES[`c-${n}-${palo}`] = `el ${nombres[n]} de ${palo}.`;
  }
})();

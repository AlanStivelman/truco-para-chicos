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

  // Final
  'estrellas-1': 'Ganaste una estrella.',
  'estrellas-2': '¡Ganaste dos estrellas!',
  'estrellas-3': '¡Ganaste tres estrellas!',
  'fin-bien': '¡Qué bien jugaste!',
  'fin-otra': '¿Jugamos otra vez?',
};

// Nombres de las 40 cartas: ids 'c-<numero>-<palo>'
(() => {
  const nombres = { 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 10: 'diez', 11: 'once', 12: 'doce' };
  for (const palo of ['espada', 'basto', 'oro', 'copa']) {
    for (const n in nombres) FRASES[`c-${n}-${palo}`] = `el ${nombres[n]} de ${palo}.`;
  }
})();

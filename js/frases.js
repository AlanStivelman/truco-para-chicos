// Todas las frases que dice el juego. Cada una tiene un id: si existe una
// grabación audio/<id>.mp3 (listada en audio/manifest.json) se usa esa;
// si no, la lee la voz del dispositivo.
const FRASES = {
  'hola': '¡Hola! Soy Capi. Vamos a aprender a jugar al truco.',
  'elegi-juego': 'Tocá un juego para empezar.',
  'nivel-cerrado': 'Ese juego todavía está cerrado. Primero jugá el anterior.',
  'nivel-pronto': 'Ese juego todavía se está armando. ¡Pronto vas a poder jugarlo!',

  // Nivel 0: conocer las cartas
  'n0-intro': 'En el truco jugamos de a dos. Cada uno tiene tres cartas. Los dos tiran una carta, y gana la más fuerte. Primero vamos a conocer las cartas.',
  'n0-palos': 'Las cartas tienen cuatro dibujitos. Tocá cada uno para escuchar cómo se llama.',
  'palo-espada': 'Espada.',
  'palo-basto': 'Basto.',
  'palo-oro': 'Oro.',
  'palo-copa': 'Copa.',
  'n0-palos-bien': '¡Muy bien! Espada, basto, oro y copa.',
  'n0-campeonas': 'Ahora vamos a conocer las cartas más fuertes. Tocá el lugar que brilla para ver qué carta va.',
  'n0-campeonas-fin': '¡Estas cuatro son las campeonas! Le ganan a todas las demás cartas.',
  'n0-resto': 'Ahora vienen las demás cartas, de la más fuerte a la más bajita. Tocá el lugar que brilla.',
  'n0-tabla-fin': '¡Ya conocés todas las cartas! Tocá cualquiera de estas cartas para escucharla otra vez. Cuando quieras, tocá el botón amarillo para seguir.',
  // tabla-N: N es la fuerza de la carta (14 es la más fuerte). Cada frase se entiende sola.
  'tabla-14': 'El uno de espada es la carta más fuerte de todas. Le gana a todas.',
  'tabla-13': 'El uno de basto es la segunda carta más fuerte.',
  'tabla-12': 'El siete de espada es la tercera carta más fuerte.',
  'tabla-11': 'El siete de oro es la cuarta carta más fuerte.',
  'tabla-10': 'Los tres le ganan a todas las cartas que no son campeonas. Los tres de todos los dibujitos valen igual.',
  'tabla-9': 'Los dos vienen después de los tres. Los dos de todos los dibujitos valen igual.',
  'tabla-8': 'El uno de oro y el uno de copa vienen después de los dos. Ojo: no son campeones como el uno de espada y el uno de basto.',
  'tabla-7': 'Los doce vienen después de los unos. Todos los doce valen igual.',
  'tabla-6': 'Los once vienen después de los doce.',
  'tabla-5': 'Los diez vienen después de los once.',
  'tabla-4': 'El siete de basto y el siete de copa vienen después de los diez. Ojo: no son campeones como el siete de espada y el siete de oro.',
  'tabla-3': 'Los seis vienen después de esos sietes.',
  'tabla-2': 'Los cinco vienen después de los seis.',
  'tabla-1': 'Los cuatros son las cartas más bajitas de todas. Casi no le ganan a nada.',

  // Nivel 1: qué carta gana
  'n1-intro': 'Vamos a ver qué carta es más fuerte. Mirá la barrita amarilla: la más larga gana.',
  'n1-pregunta': '¿Cuál gana? Tocala.',
  'n1-sin-barra': '¡Muy bien! Ahora sin la barrita. Vos podés.',
  'muy-bien': '¡Muy bien!',
  'gana': 'Gana',
  'casi': 'Casi.',
  'mas-fuerte-es': 'La más fuerte es',

  // Nivel 2: ganar la ronda
  'n2-intro': 'Ahora jugamos vos y yo. Cada uno tiene tres cartas. El que gana dos veces, gana la ronda.',
  'te-toca': 'Dale, te toca. Tocá una carta.',
  'capi-jugo': 'Yo tiro',
  'pista-fuerte': 'Te toca. Empezá con tu carta más fuerte.',
  'pista-gana': 'Te toca. Esta carta le gana a la mía.',
  'pista-baja': 'A esa no le podés ganar. Tirá tu carta más bajita.',
  'mano-tuya': '¡Esa la ganaste vos!',
  'mano-capi': 'Esa la gané yo.',
  'parda': 'Empatamos. Eso se llama parda.',
  'ronda-tuya': '¡Ganaste la ronda! Uy, me ganaste, che.',
  'ronda-capi': 'Esta ronda la gané yo. No pasa nada.',
  'otra-ronda': 'Vamos con otra ronda.',

  // Nivel 3: el truco
  'n3-intro': 'Hoy aprendemos el truco. Jugamos hasta seis puntos. Si tenés cartas fuertes, tocá el megáfono para cantar truco, y la ronda vale más.',
  'yo-truco': '¡Truco!',
  'yo-retruco': '¡Quiero retruco!',
  'yo-vale-cuatro': '¡Quiero vale cuatro!',
  'yo-quiero': '¡Quiero!',
  'yo-no-quiero': 'No quiero.',
  'capi-truco': '¡Te canto truco! Si decís quiero, la ronda vale dos puntos. Si decís no quiero, gano yo un punto.',
  'capi-retruco': '¡Te digo quiero retruco! Si decís quiero, la ronda vale tres puntos. Si decís no quiero, gano yo dos.',
  'capi-vale-cuatro': '¡Te digo quiero vale cuatro! Si decís quiero, la ronda vale cuatro puntos. Si decís no quiero, gano yo tres.',
  'capi-quiero': '¡Sí, quiero!',
  'capi-no-quiero': 'Uy, no quiero.',
  'vale-2': 'Ahora la ronda vale dos puntos.',
  'vale-3': 'Ahora la ronda vale tres puntos.',
  'vale-4': 'Ahora la ronda vale cuatro puntos.',
  'pista-truco': 'Tenés cartas muy fuertes. ¡Tocá el megáfono y cantá truco!',
  'pista-subir': 'Tenés cartas muy fuertes. ¡Tocá el megáfono y subí la apuesta!',
  'pista-quiero': 'Tenés buenas cartas. Tocá el pulgar para arriba y decí quiero.',
  'pista-no-quiero': '¡Ojo al piojo! Tus cartas son bajitas. Mejor tocá el pulgar para abajo y decí no quiero.',
  'ganaste-1': '¡Ganaste un punto!',
  'ganaste-2': '¡Ganaste dos puntos!',
  'ganaste-3': '¡Ganaste tres puntos!',
  'ganaste-4': '¡Ganaste cuatro puntos!',
  'capi-gano-1': 'Gané yo un punto.',
  'capi-gano-2': 'Gané yo dos puntos.',
  'capi-gano-3': 'Gané yo tres puntos.',
  'capi-gano-4': 'Gané yo cuatro puntos.',
  'partida-tuya': '¡Ganaste la partida! ¡Sos un campeón!',
  'partida-capi': 'Esta vez gané yo. ¡Dale, que la próxima es tuya!',

  // Nivel 4: el envido
  'n4-intro': 'Hoy aprendemos el envido. En el envido gana el que tiene más tantos. Para tener muchos tantos, hacen falta dos cartas con el mismo dibujito.',
  'n4-toca-par': 'Tocá las dos cartas que tienen el mismo dibujito.',
  'n4-no-par': 'Esas no tienen el mismo dibujito. Mirá bien los dibujitos.',
  'n4-par-bien': '¡Muy bien! Tienen el mismo dibujito. Contamos los tantos:',
  'figuras-cero': 'El diez, el once y el doce valen cero.',
  'veinte': 'Veinte',
  'mas': 'más',
  'son': 'son',
  'n4-partida': 'Ahora jugamos vos y yo hasta nueve puntos. Si tenés muchos tantos, tocá el botón del más para cantar envido.',
  'yo-envido': '¡Envido!',
  'yo-real-envido': '¡Real envido!',
  'capi-envido': '¡Te canto envido!',
  'capi-real-envido': '¡Te canto real envido!',
  'si-quiero-envido-2': 'Si decís quiero, el que tiene más tantos gana dos puntos.',
  'si-quiero-envido-3': 'Si decís quiero, el que tiene más tantos gana tres puntos.',
  'si-quiero-envido-4': 'Si decís quiero, el que tiene más tantos gana cuatro puntos.',
  'si-quiero-envido-5': 'Si decís quiero, el que tiene más tantos gana cinco puntos.',
  'si-quiero-envido-7': 'Si decís quiero, el que tiene más tantos gana siete puntos.',
  'si-no-quiero-1': 'Si decís no quiero, gano yo un punto.',
  'si-no-quiero-2': 'Si decís no quiero, gano yo dos puntos.',
  'si-no-quiero-4': 'Si decís no quiero, gano yo cuatro puntos.',
  'vos-tenes': 'Vos tenés',
  'capi-tengo': 'Yo tengo',
  'sin-par-yo': 'No tenés dos cartas con el mismo dibujito, así que vale tu carta más alta.',
  'sin-par-capi': 'Como no tengo dos cartas con el mismo dibujito, vale mi carta más alta.',
  'envido-tuyo': '¡Son buenas! Ganaste el envido.',
  'envido-capi': 'El envido lo gané yo.',
  'envido-empate': 'Empatamos. Cuando empatamos, gana el que empezó la ronda.',
  'truco-espera': 'Ahora sí: yo te había cantado truco. ¿Querés o no querés?',
  'truco-espera-tuyo': 'Ahora tengo que contestar tu truco.',
  'pista-envido': 'Tenés muchos tantos. ¡Tocá el botón del más y cantá envido!',
  'pista-real-envido': 'Tenés muchísimos tantos. ¡Tocá el botón del más y subí a real envido!',
  'pista-quiero-envido': 'Tenés muchos tantos. Tocá el pulgar para arriba y decí quiero.',
  'pista-no-quiero-envido': '¡Ojo al piojo! Tenés pocos tantos. Mejor tocá el pulgar para abajo y decí no quiero.',
  'ganaste-5': '¡Ganaste cinco puntos!',
  'ganaste-7': '¡Ganaste siete puntos!',
  'capi-gano-5': 'Gané yo cinco puntos.',
  'capi-gano-7': 'Gané yo siete puntos.',

  // Frases de Capi con tonada de la mesa de truco
  'capi-ah-bueno': '¡Ah, bueno! Dejame pensar.',
  'son-buenas': 'En el truco, el que pierde el envido dice: son buenas.',
  'capi-mate': 'Esperá que tomo un matecito. Listo.',

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

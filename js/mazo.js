// Mazo de 40 cartas españolas y su fuerza en el truco. Sin nada de pantalla:
// lo usan tanto el juego como las pruebas.
const PALOS = ['espada', 'basto', 'oro', 'copa'];
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const FUERZA_MAX = 14;

// Fuerza: 14 es la carta que le gana a todas, 1 la más bajita.
function fuerza(n, palo) {
  if (n === 1 && palo === 'espada') return 14;
  if (n === 1 && palo === 'basto') return 13;
  if (n === 7 && palo === 'espada') return 12;
  if (n === 7 && palo === 'oro') return 11;
  return { 3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1 }[n];
}

const MAZO = PALOS.flatMap(palo => NUMEROS.map(n => ({ n, palo, f: fuerza(n, palo), id: `c-${n}-${palo}` })));

function barajar(lista, rng = Math.random) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

if (typeof module !== 'undefined') module.exports = { PALOS, NUMEROS, FUERZA_MAX, MAZO, fuerza, barajar };

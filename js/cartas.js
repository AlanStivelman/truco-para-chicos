// Cómo se dibujan las cartas, los íconos y los personajes (estética Truco Recreo).
// Las cartas salen de la hoja img/baraja-espanola.webp: 12 columnas (del 1 al 12) por 5 filas
// (oros, copas, espadas, bastos y, en la quinta, el dorso en la columna 2).
const FILA_PALO = { oro: 0, copa: 1, espada: 2, basto: 3 };
const posicionCarta = (col, fila) => `${(col / 11) * 100}% ${(fila / 4) * 100}%`;

function crearCarta(c, { conFuerza = true } = {}) {
  const b = document.createElement('button');
  b.className = 'carta' + (conFuerza ? ' con-fuerza' : '');
  b.setAttribute('aria-label', FRASES[c.id]);
  b.dataset.id = c.id;
  b.style.backgroundPosition = posicionCarta(c.n - 1, FILA_PALO[c.palo]);
  b.innerHTML = `<span class="fuerza" aria-hidden="true"><i style="width:${Math.round((c.f / FUERZA_MAX) * 100)}%"></i></span>`;
  return b;
}

// Una carta boca abajo (las que le quedan a Capi).
function crearDorso() {
  const d = document.createElement('div');
  d.className = 'carta dorso';
  d.setAttribute('aria-hidden', 'true');
  d.style.backgroundPosition = posicionCarta(1, 4);
  return d;
}

// Las fichas de palo del nivel 0: una carta de cada palo con su nombre.
const CARTA_PALO = { espada: 1, basto: 1, oro: 3, copa: 1 };
const NOMBRE_PALO = { espada: 'Espada', basto: 'Basto', oro: 'Oro', copa: 'Copa' };
function crearPalo(palo) {
  const b = document.createElement('button');
  b.className = 'ficha-palo';
  b.setAttribute('aria-label', FRASES['palo-' + palo]);
  const carta = document.createElement('span');
  carta.className = 'carta';
  carta.style.backgroundPosition = posicionCarta(CARTA_PALO[palo] - 1, FILA_PALO[palo]);
  b.appendChild(carta);
  b.insertAdjacentHTML('beforeend', `<span class="ficha-palo-nombre">${NOMBRE_PALO[palo]}</span>`);
  return b;
}

// Íconos de trazo en una grilla de 24 (design system: tinta sobre blanco o sol, blanco sobre mesa, tomate o uva).
const ICONO = {
  casa: '<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>',
  parlante: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5c1.5 1.5 1.5 5.5 0 7M19 6c3 3 3 9 0 12"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  libro: '<path d="M2.5 6.5c3-1.4 6.3-1.2 9.5 1v12c-3.2-2.2-6.5-2.4-9.5-1z"/><path d="M21.5 6.5c-3-1.4-6.3-1.2-9.5 1v12c3.2-2.2 6.5-2.4 9.5-1z"/>',
  megafono: '<path d="M3 10v4h3l9 5V5L6 10H3z"/><path d="M18 9c1.5 1.5 1.5 4.5 0 6M6 14l1.5 6H10l-1-5.2"/>',
  envido: '<rect x="3" y="5" width="9" height="14" rx="1.6" transform="rotate(-10 7.5 12)"/><rect x="11" y="5" width="9" height="14" rx="1.6" transform="rotate(10 15.5 12)"/><path d="M15.5 9.5v5M13 12h5"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trofeo: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6v3H9z"/>',
  otra: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  listo: '<path d="M5 12.5 10 17.5 19 7"/>',
  flecha: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  igual: '<path d="M6 9.5h12M6 14.5h12"/>',
  arriba: '<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/>',
  abajo: '<path d="M7 13V4H4v9z"/><path d="M7 13l4 7c1.5 0 2.5-1 2.2-2.6L12.6 14H18a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 16.8 4H7"/>',
};
const icono = (nombre, ancho = 2.8) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONO[nombre]}</svg>`;
const SVG_JUGAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5v15c0 .8.9 1.3 1.6.8l11-7.5c.6-.4.6-1.2 0-1.6l-11-7.5C8.9 3.2 8 3.7 8 4.5z" fill="currentColor"/></svg>';
const SVG_ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2.5 14.9,8.6 21.5,9.3 16.6,13.8 18,20.4 12,17 6,20.4 7.4,13.8 2.5,9.3 9.1,8.6" stroke="#1D3557" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const SVG_LIBRO_ESTRELLA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  ICONO.libro + '<path d="M16.5 2.5l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z" fill="#FFC93C" stroke="#1D3557" stroke-width="1"/></svg>';

// Capi y la cara del nene.
const IMG_CAPI = '<img src="img/capi.svg" alt="" draggable="false">';
const SVG_NENE =
  '<svg viewBox="0 0 100 100" aria-hidden="true">' +
  '<path d="M18 100 C18 76 34 68 50 68 C66 68 82 76 82 100 Z" fill="#E8502E"/>' +
  '<circle cx="50" cy="44" r="26" fill="#F4C9A0"/>' +
  '<path d="M24 40 C24 18 76 14 76 40 C68 30 56 26 44 30 C38 32 30 34 24 40 Z" fill="#5A3A22"/>' +
  '<circle cx="41" cy="46" r="3.6" fill="#1D3557"/><circle cx="59" cy="46" r="3.6" fill="#1D3557"/>' +
  '<path d="M40 56 Q50 64 60 56" fill="none" stroke="#1D3557" stroke-width="3.6" stroke-linecap="round"/>' +
  '</svg>';

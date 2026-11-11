// Cómo se dibujan las cartas, los personajes y los íconos (design system Truco Recreo).

// Las cartas salen de img/baraja-espanola.webp: 12 columnas (del 1 al 12) por 5 filas
// (oro, copa, espada, basto y, en la última, el dorso en la segunda columna).
const FILA_PALO = { oro: 0, copa: 1, espada: 2, basto: 3 };
function posicionNaipe(n, palo) {
  return `${((n - 1) / 11 * 100).toFixed(4)}% ${FILA_PALO[palo] / 4 * 100}%`;
}

function crearCarta(c, { conFuerza = true } = {}) {
  const b = document.createElement('button');
  b.className = `carta palo-${c.palo}` + (conFuerza ? '' : ' sin-fuerza');
  b.setAttribute('aria-label', FRASES[c.id]);
  b.dataset.id = c.id;
  b.innerHTML =
    `<span class="naipe" style="background-position:${posicionNaipe(c.n, c.palo)}"></span>` +
    `<span class="fuerza"><i style="width:${Math.round((c.f / FUERZA_MAX) * 100)}%"></i></span>`;
  return b;
}

// Un palo para tocar (nivel 0): una carta que muestra bien el dibujito, y su nombre.
// El 1 de oro es un escudo con letras y no se lee como moneda: se usa el 3.
const CARTA_DEL_PALO = { espada: 1, basto: 1, oro: 3, copa: 1 };
function crearPalo(palo) {
  const b = document.createElement('button');
  b.className = 'dibujo-palo';
  b.setAttribute('aria-label', FRASES['palo-' + palo]);
  b.innerHTML =
    `<span class="naipe" style="background-position:${posicionNaipe(CARTA_DEL_PALO[palo], palo)}"></span>` +
    `<span class="nombre-palo">${FRASES['palo-' + palo].replace('.', '')}</span>`;
  return b;
}

// Capi, la capibara con mate: es el rival y también el guía.
const SVG_CAPI =
  '<svg viewBox="0 0 200 200" aria-hidden="true">' +
  '<path d="M36 198 C28 150 46 110 100 110 C154 110 172 150 164 198 Z" fill="#B07A4F"/>' +
  '<path d="M66 198 C62 166 76 142 100 142 C124 142 138 166 134 198 Z" fill="#CFA077"/>' +
  '<circle cx="60" cy="36" r="12" fill="#8E5B36"/><circle cx="140" cy="36" r="12" fill="#8E5B36"/>' +
  '<circle cx="60" cy="37" r="5" fill="#5E3A22"/><circle cx="140" cy="37" r="5" fill="#5E3A22"/>' +
  '<rect x="44" y="28" width="112" height="98" rx="46" fill="#B07A4F"/>' +
  '<rect x="60" y="74" width="80" height="54" rx="27" fill="#946038"/>' +
  '<ellipse cx="86" cy="88" rx="5.5" ry="3.4" fill="#3B2416"/><ellipse cx="114" cy="88" rx="5.5" ry="3.4" fill="#3B2416"/>' +
  '<path d="M90 108 Q100 116 110 108" fill="none" stroke="#3B2416" stroke-width="4" stroke-linecap="round"/>' +
  '<circle cx="58" cy="92" r="8" fill="#E89A7A" opacity="0.6"/><circle cx="142" cy="92" r="8" fill="#E89A7A" opacity="0.6"/>' +
  '<path d="M66 62 Q75 55 84 62 M116 62 Q125 55 134 62" fill="none" stroke="#3B2416" stroke-width="5" stroke-linecap="round"/>' +
  '<path d="M104 150 C104 136 150 136 150 150 C156 176 140 194 127 194 C114 194 98 176 104 150 Z" fill="#7A5A2E"/>' +
  '<path d="M105 160 C120 164 134 164 149 160" fill="none" stroke="#D9A441" stroke-width="4"/>' +
  '<ellipse cx="127" cy="146" rx="24" ry="7" fill="#C9CED6" stroke="#7E8692" stroke-width="2.5"/>' +
  '<ellipse cx="127" cy="146" rx="18" ry="4.5" fill="#7FA03A"/>' +
  '<path d="M131 146 L107 113" fill="none" stroke="#C9CED6" stroke-width="5" stroke-linecap="round"/>' +
  '<path d="M131 146 L107 113" fill="none" stroke="#7E8692" stroke-width="1.5" stroke-linecap="round"/>' +
  '<ellipse cx="106" cy="172" rx="11" ry="9" fill="#8E5B36"/><ellipse cx="150" cy="174" rx="11" ry="9" fill="#8E5B36"/>' +
  '</svg>';
// Nombres viejos, para los usos que todavía los nombran.
const SVG_CARPINCHO = SVG_CAPI;
const SVG_ZORRO = SVG_CAPI;

// La carita del chico, para su lado de la mesa.
const SVG_NENE =
  '<svg viewBox="0 0 100 100" aria-hidden="true">' +
  '<path d="M18 100 C18 76 34 68 50 68 C66 68 82 76 82 100 Z" fill="#3D7DD8"/>' +
  '<circle cx="50" cy="44" r="26" fill="#F4C9A0"/>' +
  '<path d="M24 40 C24 18 76 14 76 40 C68 30 56 26 44 30 C38 32 30 34 24 40 Z" fill="#5A3A22"/>' +
  '<circle cx="41" cy="46" r="3.6" fill="#1D3557"/><circle cx="59" cy="46" r="3.6" fill="#1D3557"/>' +
  '<path d="M40 56 Q50 64 60 56" fill="none" stroke="#1D3557" stroke-width="3.6" stroke-linecap="round"/>' +
  '</svg>';

// Íconos de trazo, en una grilla de 24. Toman el color del texto del botón.
const TRAZOS = {
  casa: '<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  parlante: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5c1.5 1.5 1.5 5.5 0 7M19 6c3 3 3 9 0 12"/>',
  libro: '<path d="M2.5 6.5c3-1.4 6.3-1.2 9.5 1v12c-3.2-2.2-6.5-2.4-9.5-1z"/><path d="M21.5 6.5c-3-1.4-6.3-1.2-9.5 1v12c3.2-2.2 6.5-2.4 9.5-1z"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  megafono: '<path d="M3 10v4h3l9 5V5L6 10H3z"/><path d="M18 9c1.5 1.5 1.5 4.5 0 6M6 14l1.5 6H10l-1-5.2"/>',
  envido: '<rect x="3" y="5" width="9" height="14" rx="1.6" transform="rotate(-10 7.5 12)"/><rect x="11" y="5" width="9" height="14" rx="1.6" transform="rotate(10 15.5 12)"/><path d="M15.5 9.5v5M13 12h5"/>',
  tilde: '<path d="M5 12.5 10 17.5 19 7"/>',
  cruz: '<path d="M6 6l12 12M18 6 6 18"/>',
  repetir: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  dos: '<rect x="2.5" y="5" width="8" height="12" rx="1.5" transform="rotate(-8 6.5 11)"/><rect x="13.5" y="5" width="8" height="12" rx="1.5" transform="rotate(8 17.5 11)"/><path d="M11 18.5h2"/>',
  tres: '<circle cx="5" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="19" cy="12" r="3"/>',
  flecha: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  igual: '<path d="M6 9.5h12M6 14.5h12"/>',
  trofeo: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6v3H9z"/>',
};
function icono(nombre) {
  return `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAZOS[nombre]}</svg>`;
}
// El triángulo de jugar y la estrella van rellenos.
const SVG_PLAY = '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5v15c0 .8.9 1.3 1.6.8l11-7.5c.6-.4.6-1.2 0-1.6l-11-7.5C8.9 3.2 8 3.7 8 4.5z" fill="currentColor"/></svg>';
function estrella(llena) {
  return `<svg class="estrella${llena ? ' si' : ''}" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2.5 14.9,8.6 21.5,9.3 16.6,13.8 18,20.4 12,17 6,20.4 7.4,13.8 2.5,9.3 9.1,8.6" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}

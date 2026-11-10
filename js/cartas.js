// Cómo se dibujan las cartas y los personajes.
const DIBUJO_PALO = {
  oro: '<circle cx="50" cy="50" r="40" fill="#F2B632"/><circle cx="50" cy="50" r="27" fill="none" stroke="#D99A1C" stroke-width="5"/><circle cx="50" cy="50" r="9" fill="#D99A1C"/>',
  copa: '<path d="M24 16 H76 Q76 56 50 60 Q24 56 24 16Z" fill="#E0564F"/><rect x="45" y="58" width="10" height="20" fill="#C2423C"/><rect x="30" y="76" width="40" height="11" rx="5.5" fill="#C2423C"/>',
  espada: '<path d="M50 4 L60 20 V62 H40 V20Z" fill="#6C9FE0"/><rect x="26" y="60" width="48" height="10" rx="5" fill="#3E6DB0"/><rect x="44" y="68" width="12" height="20" fill="#3E6DB0"/><circle cx="50" cy="90" r="7" fill="#3E6DB0"/>',
  basto: '<path d="M41 90 L36 30 Q36 8 50 8 Q64 8 64 30 L59 90 Q50 97 41 90Z" fill="#5FA868"/><circle cx="51" cy="30" r="5" fill="#468550"/><circle cx="46" cy="54" r="4" fill="#468550"/><circle cx="53" cy="72" r="3.5" fill="#468550"/>',
};

function crearCarta(c, { conFuerza = true } = {}) {
  const b = document.createElement('button');
  b.className = `carta palo-${c.palo}` + (conFuerza ? '' : ' sin-fuerza');
  b.setAttribute('aria-label', FRASES[c.id]);
  b.innerHTML =
    `<span class="num">${c.n}</span>` +
    `<svg class="palo" viewBox="0 0 100 100" aria-hidden="true">${DIBUJO_PALO[c.palo]}</svg>` +
    `<span class="fuerza"><i style="width:${Math.round((c.f / FUERZA_MAX) * 100)}%"></i></span>`;
  return b;
}

const SVG_CARPINCHO =
  '<svg viewBox="0 0 120 120" aria-hidden="true">' +
  '<ellipse cx="30" cy="24" rx="8" ry="7" fill="#8A5A3B"/><ellipse cx="90" cy="24" rx="8" ry="7" fill="#8A5A3B"/>' +
  '<rect x="20" y="18" width="80" height="92" rx="32" fill="#B07A4E"/>' +
  '<rect x="27" y="56" width="66" height="50" rx="22" fill="#C48E60"/>' +
  '<ellipse cx="60" cy="68" rx="14" ry="6.5" fill="#5A3A26"/>' +
  '<circle cx="38" cy="44" r="5" fill="#3A2A1E"/><circle cx="82" cy="44" r="5" fill="#3A2A1E"/>' +
  '<path d="M50 88 Q60 95 70 88" fill="none" stroke="#5A3A26" stroke-width="3.5" stroke-linecap="round"/>' +
  '</svg>';

const SVG_ZORRO =
  '<svg viewBox="0 0 120 120" aria-hidden="true">' +
  '<path d="M20 46 L28 8 L56 32Z" fill="#E8843C"/><path d="M100 46 L92 8 L64 32Z" fill="#E8843C"/>' +
  '<ellipse cx="60" cy="66" rx="44" ry="38" fill="#F09A4F"/>' +
  '<path d="M60 104 Q28 100 20 72 Q44 80 60 62 Q76 80 100 72 Q92 100 60 104Z" fill="#FFF6E8"/>' +
  '<circle cx="43" cy="58" r="5.5" fill="#3A2A1E"/><circle cx="77" cy="58" r="5.5" fill="#3A2A1E"/>' +
  '<ellipse cx="60" cy="84" rx="7" ry="5" fill="#3A2A1E"/>' +
  '</svg>';

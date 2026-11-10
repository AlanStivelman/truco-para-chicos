// El rival de la compu. Mira el estado del motor y elige una de las acciones permitidas.
// Juega simple y sin mentir: pensado para que un chico pueda entender por qué hizo cada cosa.
const Bot = (() => {
  const M = typeof module !== 'undefined' && module.exports ? require('./motor.js') : Motor;

  // excluir: tipos de acción que no se usan en este nivel (por ejemplo, el envido).
  function elegir(e, rng = Math.random, excluir = []) {
    const j = M.actor(e);
    const permitidas = M.acciones(e).filter(a => !excluir.includes(a.tipo));
    const puede = tipo => permitidas.some(a => a.tipo === tipo);
    const cartas = e.manos[j].slice().sort((a, b) => a.f - b.f);
    const tantos = M.tantos(e.repartidas[j]);
    // Qué tan buena es la mano para el truco: la mejor carta que le queda (o la que ya tiró).
    const mejor = Math.max(...cartas.map(c => c.f), e.mesa[j] ? e.mesa[j].f : 0);
    const ganoUna = e.bazas.includes(j);

    if (e.envido.pendiente) {
      if (tantos >= 31 && puede('real-envido')) return { tipo: 'real-envido' };
      if (tantos >= 27 || (tantos >= 24 && rng() < 0.5)) return { tipo: 'quiero' };
      return { tipo: 'no-quiero' };
    }

    if (e.truco.pendiente) {
      if (puede('envido') && tantos >= 28) return { tipo: 'envido' };
      const subir = M.CANTOS_TRUCO[e.truco.pendiente.nivel];
      if (subir && mejor >= 13 && puede(subir)) return { tipo: subir };
      if (mejor >= 10 || (ganoUna && mejor >= 8)) return { tipo: 'quiero' };
      return { tipo: 'no-quiero' };
    }

    if (puede('envido') && tantos >= 28) return { tipo: 'envido' };
    const canto = M.CANTOS_TRUCO[e.truco.nivel];
    if (canto && puede(canto) && mejor >= 11 && rng() < 0.6) return { tipo: canto };

    // Tirar carta: si ya hay una en la mesa, la más baja que le gane; si no se puede, la más baja.
    const rival = e.mesa[1 - j];
    let carta;
    if (rival) carta = cartas.find(c => c.f > rival.f) || cartas[0];
    else carta = cartas[cartas.length - 1];
    return { tipo: 'carta', carta };
  }

  return { elegir };
})();

if (typeof module !== 'undefined') module.exports = Bot;

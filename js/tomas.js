// Las tomas que el papá graba en este navegador (IndexedDB). Las comparten la pantalla de grabar
// y la voz del juego. Dos almacenes: 'meta' (id -> { huella, fecha, segundos }, chico, se lee al
// arrancar) y 'audio' (id -> { bytes: ArrayBuffer, tipo }). Si IndexedDB no anda (modo privado,
// file://), todo devuelve vacío y el juego sigue con la voz del dispositivo.
const Tomas = (() => {
  const BASE = 'truco-tomas';
  let abierta = null;

  function abrir() {
    if (abierta) return abierta;
    abierta = new Promise((ok, mal) => {
      try {
        const pedido = indexedDB.open(BASE, 1);
        pedido.onupgradeneeded = () => {
          pedido.result.createObjectStore('meta');
          pedido.result.createObjectStore('audio');
        };
        pedido.onsuccess = () => ok(pedido.result);
        pedido.onerror = () => mal(pedido.error);
        pedido.onblocked = () => mal(new Error('base bloqueada'));
      } catch (e) { mal(e); }
    });
    abierta.catch(() => { abierta = null; });
    return abierta;
  }

  function pedir(almacen, modo, hacer) {
    return abrir().then(db => new Promise((ok, mal) => {
      const tx = db.transaction(almacen, modo);
      const r = hacer(tx);
      tx.oncomplete = () => ok(r && 'result' in r ? r.result : undefined);
      tx.onerror = tx.onabort = () => mal(tx.error);
    }));
  }

  // Map id -> { huella, fecha, segundos }
  async function metas() {
    try {
      const db = await abrir();
      return await new Promise((ok, mal) => {
        const m = new Map();
        const tx = db.transaction('meta', 'readonly');
        const c = tx.objectStore('meta').openCursor();
        c.onsuccess = () => { const cur = c.result; if (cur) { m.set(cur.key, cur.value); cur.continue(); } };
        tx.oncomplete = () => ok(m);
        tx.onerror = tx.onabort = () => mal(tx.error);
      });
    } catch (e) { return new Map(); }
  }

  async function audio(id) {
    try {
      const v = await pedir('audio', 'readonly', tx => tx.objectStore('audio').get(id));
      return v ? v.bytes : null;
    } catch (e) { return null; }
  }

  function guardar(id, bytes, meta) {
    return abrir().then(db => new Promise((ok, mal) => {
      const tx = db.transaction(['meta', 'audio'], 'readwrite');
      tx.objectStore('audio').put({ bytes, tipo: 'audio/wav' }, id);
      tx.objectStore('meta').put(meta, id);
      tx.oncomplete = () => ok();
      tx.onerror = tx.onabort = () => mal(tx.error);
    }));
  }

  function borrarTodo() {
    return abrir().then(db => new Promise((ok, mal) => {
      const tx = db.transaction(['meta', 'audio'], 'readwrite');
      tx.objectStore('meta').clear();
      tx.objectStore('audio').clear();
      tx.oncomplete = () => ok();
      tx.onerror = tx.onabort = () => mal(tx.error);
    }));
  }

  return { metas, audio, guardar, borrarTodo };
})();

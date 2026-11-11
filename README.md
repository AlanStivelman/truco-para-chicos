# Truco para chicos

Juego web para que un nene que todavía no lee aprenda a jugar al Truco Argentino. Todo se explica con voz, las cartas son bien grandes y no hay texto que haga falta leer.

## Cómo abrirlo

Se publica con GitHub Pages desde `main` en https://alanstivelman.github.io/truco-para-chicos/ (falta confirmar que abre bien en la tablet).


Es una página estática, sin instalación ni compilación:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. También funciona abriendo `index.html` directamente.

## Estado

| Nivel | Qué enseña | Estado |
|---|---|---|
| 0 | Qué es el truco, los palos y la tabla de cartas | Listo |
| 1 | Qué carta le gana a cuál | Listo |
| 2 | Ganar la ronda (mejor de tres) contra Capi | Listo |
| 3 | El Truco: cantar, querer o no querer, a 6 puntos | Listo |
| 4 | El envido: práctica de cartas del mismo palo y partida a 9 | Listo |
| 5 | Partida completa a 15 | Pendiente |

## Voz

Las frases están en `js/frases.js`, cada una con un id. Si hay una grabación del papá para una frase, el juego usa esa; si no, la lee la voz en español del dispositivo.

**Para grabar:** abrir `grabar.html` (en GitHub Pages: https://alanstivelman.github.io/truco-para-chicos/grabar.html), dar permiso al micrófono y grabar frase por frase. Lo grabado queda en ese navegador y el juego ya lo usa en ese mismo aparato. Para que suene en todos lados, tocar "Descargar las grabaciones (.zip)" y pasarle el zip a Claude, que lo descomprime en `audio/` (trae `audio/<id>.wav` y `audio/manifest.json`) y lo sube con un pull request.

Cada grabación guarda una huella del texto: si después se cambia el texto de una frase, la grabación vieja deja de usarse y la pantalla de grabar la marca para regrabar.

## Documentos para trabajar en el proyecto

- `CONTEXT.md`: para quién es, decisiones y reglas confirmadas.
- `STATE.md`: en qué punto está.
- `AGENTS.md`: cómo trabajar, incluida la revisión obligatoria con Fable en cambios grandes.

## Estructura

- `index.html`: las cuatro pantallas (inicio, niveles, juego, fin).
- `css/style.css`: estilos del design system Truco Recreo.
- `img/`: la baraja española ilustrada (una hoja de 12 × 5 cartas) y Capi.
- `CREDITOS.md` y `creditos.html`: autoría y licencias (la baraja es CC BY-SA 3.0, de Basquetteur en Wikimedia Commons).
- `fonts/`: Fredoka (licencia SIL OFL en `fonts/OFL.txt`), servida desde el repo para que ande sin conexión.
- `js/mazo.js`: mazo y fuerza de cada carta.
- `js/motor.js`: reglas del truco (bazas, truco, retruco, vale cuatro, envido, real envido, puntos a 15). Sin pantalla.
- `js/bot.js`: el rival de la compu.
- `js/cartas.js`: cartas, Capi e íconos.
- `js/voz.js`: voz y sonidos. Usa las grabaciones (las del navegador primero, después las de `audio/`) y si no, la voz del dispositivo.
- `grabar.html`, `js/grabar.js`, `css/grabar.css`: pantalla para que el papá grabe las frases.
- `js/audio-util.js`: preparar tomas, WAV, zip y grupos de frases. Sin pantalla, se prueba en Node.
- `js/tomas.js`: las grabaciones guardadas en el navegador (IndexedDB).
- `js/app.js`: niveles y navegación.

## Pruebas

```bash
npm test
```

Prueban las reglas del motor y juegan 500 partidas completas entre dos bots.

Los niveles 3 y 4 usan el motor y el bot; el nivel 5 se construye sobre lo mismo.

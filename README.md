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

Las frases están en `js/frases.js`, cada una con un id. Por ahora las lee la voz en español del dispositivo. Para usar una grabación propia, guardarla como `audio/<id>.mp3` y agregar el id a `audio/manifest.json`.

## Documentos para trabajar en el proyecto

- `CONTEXT.md`: para quién es, decisiones y reglas confirmadas.
- `STATE.md`: en qué punto está.
- `AGENTS.md`: cómo trabajar, incluida la revisión obligatoria con Fable en cambios grandes.

## Estructura

- `index.html`: las cuatro pantallas (inicio, niveles, juego, fin).
- `css/style.css`: estilos.
- `js/mazo.js`: mazo y fuerza de cada carta.
- `js/motor.js`: reglas del truco (bazas, truco, retruco, vale cuatro, envido, real envido, puntos a 15). Sin pantalla.
- `js/bot.js`: el rival de la compu.
- `js/cartas.js`: dibujos de cartas y personajes.
- `js/voz.js`: voz y sonidos.
- `js/app.js`: niveles y navegación.

## Pruebas

```bash
npm test
```

Prueban las reglas del motor y juegan 500 partidas completas entre dos bots.

Los niveles 3 y 4 usan el motor y el bot; el nivel 5 se construye sobre lo mismo.

# Truco para chicos

Juego web para que un nene que todavía no lee aprenda a jugar al Truco Argentino. Todo se explica con voz, las cartas son bien grandes y no hay texto que haga falta leer.

## Cómo abrirlo

Es una página estática, sin instalación ni compilación:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. También funciona abriendo `index.html` directamente.

## Estado

| Nivel | Qué enseña | Estado |
|---|---|---|
| 1 | Qué carta le gana a cuál | Listo |
| 2 | Ganar la ronda (mejor de tres) contra el zorro | Listo |
| 3 | El Truco | Pendiente |
| 4 | El Envido | Pendiente |
| 5 | Partida completa a 15 | Pendiente |

## Voz

Las frases están en `js/frases.js`, cada una con un id. Por ahora las lee la voz en español del dispositivo. Para usar una grabación propia, guardarla como `audio/<id>.mp3` y agregar el id a `audio/manifest.json`.

## Estructura

- `index.html`: las cuatro pantallas (inicio, niveles, juego, fin).
- `css/style.css`: estilos.
- `js/cartas.js`: mazo, fuerza de cada carta y dibujos.
- `js/voz.js`: voz y sonidos.
- `js/app.js`: niveles y navegación.

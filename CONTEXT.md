# Contexto del proyecto

Qué es este juego, para quién es y por qué se decidió cada cosa. Cambia poco; lo que cambia seguido va en `STATE.md`.

## Para quién

Un nene de 6 años que **todavía no sabe leer** y quiere aprender a jugar al Truco Argentino. Lo arma su papá.

De ahí salen las reglas de diseño que no se negocian:

- **Todo con voz.** Nada que haga falta para jugar puede depender de leer texto. Cada instrucción, jugada y resultado se dice en voz alta.
- **Todo en grande.** Cartas y botones grandes, pensados para dedos chicos.
- **Calma.** Una sola cosa pasa a la vez, animaciones lentas, sin relojes ni apuro, sin música de fondo.
- **Atractivo pero sin sobreestímulo.**

## Decisiones tomadas (cuestionario inicial)

| Tema | Decisión |
|---|---|
| Dispositivo | Tablet, celular y computadora por igual |
| Rival | Capi, de la compu. Se abre desde un link en el navegador |
| Inicio | Dos botones grandes: **Aprender** (los niveles 0 a 5) y **Jugar** (una partida directa a 15 contra Capi, sin pasar por los niveles). Capi pregunta "¿Jugamos o aprendemos?" |
| Aprendizaje | Por niveles que se desbloquean: 2 estrellas en uno abre el siguiente. Un nivel que ya tiene estrellas queda abierto aunque falten las del anterior |
| Reglas de la partida completa | A 15 puntos, sin flor ni falta envido. Truco, retruco, vale cuatro, envido, real envido |
| Voz | Grabada por el papá. Mientras falte una grabación, la lee la voz del dispositivo |
| Cantos | Botones grandes con ícono y color propio, que dicen su nombre al tocarlos. Sin micrófono |
| Ayuda | Se va retirando: al principio Capi marca la jugada sugerida, después solo si se lo toca |
| Personajes | **Capi**, una capibara tomando mate, es rival y guía a la vez: juega contra el nene y le da los consejos (globo y brillo amarillo en la jugada sugerida). No hay zorro ni carpincho aparte |
| Estilo visual | Design system **"Truco Recreo"**, tipo figurita: fondo cielo, mesa azul, superficies blancas con contorno marino grueso y sombra dura, fuente Fredoka, íconos de trazo (sin emojis). Cada color significa una sola cosa: sol = acción principal, "te toca" y jugada sugerida; tomate = Truco; uva = Envido; pasto = solo decorado. Botones redondos de 66 px como mínimo. Fuente de verdad: https://claude.ai/artifact/9Jxb4GcrAZDWXMGJ1kU6Aa (mockups: https://claude.ai/artifact/SWTix64oPQV4gWZ8QuUBnF, fila B) |
| Cartas | Baraja española ilustrada clásica (hoja de sprites del design system, 12 columnas × 5 filas, la fila 5 trae el dorso). 150 px en la mano, 90 px en la mesa. Barrita de fuerza en los primeros niveles. **Licencia pendiente** (parece "Naipes libres"): confirmar el crédito antes de publicar con esa baraja |
| Premios | Estrellas por nivel y un festejo corto. Sin música |

**La estética Truco Recreo está aplicada en el código**, con Capi como único personaje. Si algo nuevo afecta la estética (pantallas, componentes), seguir el design system y pasar capturas al diseñador UI (`AGENTS.md`).

## Variantes de reglas confirmadas

El truco cambia según la casa. Estas las confirmó el papá:

1. Después de una parda sale el que es mano.
2. Se puede cantar envido-envido (vale 4) y envido-real envido (vale 5).
3. Irse al mazo le da al otro solo los puntos del truco en juego, sin punto extra por el envido.

Otras reglas que aplica el motor:

- Si las tres bazas son parda, gana el mano.
- Solo quien aceptó el truco puede subir a retruco o vale cuatro. Subir como respuesta acepta el canto anterior.
- El envido se canta solo en la primera baza, antes de tirar la carta propia y antes de que haya un truco aceptado.
- "El envido está primero": ante un truco se puede contestar con envido. Una vez resuelto el envido, el truco sigue esperando respuesta.
- Envido empatado: gana el mano.
- Tantos: dos cartas del mismo palo suman 20 más sus números; las figuras (10, 11, 12) valen 0. Sin par, vale la carta más alta.

## Niveles

| Nivel | Qué enseña |
|---|---|
| 0 | Qué es el truco, los cuatro palos y la tabla de fuerza (primero las cuatro campeonas, después el resto). No se pierde |
| 1 | Qué carta le gana a cuál |
| 2 | Ganar la ronda (mejor de tres bazas) |
| 3 | El truco: cantar, querer o no querer |
| 4 | El envido: cartas del mismo palo y tantos |
| 5 | Partida completa a 15 |

## Arquitectura

Página estática, sin compilación ni dependencias. Se abre con cualquier servidor estático.

- `js/mazo.js`: las 40 cartas y su fuerza. Sin pantalla.
- `js/motor.js`: reglas. Recibe acciones y devuelve eventos. Sin pantalla ni voz, se prueba con Node.
- `js/bot.js`: el rival, Capi (en el código las variables todavía dicen `ZORRO`). Juega simple y sin mentir, para que se entienda por qué hace cada cosa.
- `js/frases.js`: todas las frases, cada una con un id.
- `js/voz.js`: dice frases por id. Usa `audio/<id>.mp3` si está en `audio/manifest.json`; si no, la voz del dispositivo.
- `js/cartas.js`: dibujos de cartas y personajes.
- `js/app.js`: pantallas y niveles.
- `test/`: pruebas con `node --test`.

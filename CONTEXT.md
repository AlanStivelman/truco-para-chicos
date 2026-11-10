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
| Rival | Un personaje de la compu (el zorro). Se abre desde un link en el navegador |
| Aprendizaje | Por niveles que se desbloquean (2 estrellas en uno abre el siguiente) |
| Reglas de la partida completa | A 15 puntos, sin flor ni falta envido. Truco, retruco, vale cuatro, envido, real envido |
| Voz | Grabada por el papá. Mientras falte una grabación, la lee la voz del dispositivo |
| Cantos | Botones grandes con ícono y color propio, que dicen su nombre al tocarlos. Sin micrófono |
| Ayuda | Se va retirando: al principio el carpincho marca la jugada sugerida, después solo si se lo toca |
| Guía | Un carpincho con mate |
| Estilo visual | Plano y suave, bordes redondeados, celeste y crema con amarillo sol |
| Cartas | Españolas simplificadas, número gigante, barrita de fuerza en los primeros niveles |
| Premios | Estrellas por nivel y un festejo corto. Sin música |

**La estética es provisoria.** El papá pidió priorizar la lógica y definir lo visual más adelante. No invertir en estética sin que lo pida.

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
| 1 | Qué carta le gana a cuál |
| 2 | Ganar la ronda (mejor de tres bazas) |
| 3 | El truco: cantar, querer o no querer |
| 4 | El envido: cartas del mismo palo y tantos |
| 5 | Partida completa a 15 |

## Arquitectura

Página estática, sin compilación ni dependencias. Se abre con cualquier servidor estático.

- `js/mazo.js`: las 40 cartas y su fuerza. Sin pantalla.
- `js/motor.js`: reglas. Recibe acciones y devuelve eventos. Sin pantalla ni voz, se prueba con Node.
- `js/bot.js`: el zorro. Juega simple y sin mentir, para que se entienda por qué hace cada cosa.
- `js/frases.js`: todas las frases, cada una con un id.
- `js/voz.js`: dice frases por id. Usa `audio/<id>.mp3` si está en `audio/manifest.json`; si no, la voz del dispositivo.
- `js/cartas.js`: dibujos de cartas y personajes.
- `js/app.js`: pantallas y niveles.
- `test/`: pruebas con `node --test`.

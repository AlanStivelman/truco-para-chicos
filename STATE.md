# Estado

Última actualización: 2026-11-10.

## Niveles

| Nivel | Estado |
|---|---|
| 1. Qué carta gana | Listo |
| 2. Ganar la ronda | Listo |
| 3. El truco (a 6 puntos) | Listo |
| 4. El envido (práctica y partida a 9) | Listo |
| 5. Partida completa a 15 | Pendiente |

## Qué está verificado

- `npm test`: reglas del motor y 500 partidas completas entre bots.
- Niveles 1 a 4 recorridos de punta a punta en navegador sin pantalla, en tamaño tablet y celular, sin errores de consola.

## Qué no está verificado

- **La voz.** Nunca se escuchó en un dispositivo real; los entornos de prueba no tienen audio.
- Tablets y celulares reales (solo emulación de tamaño).

## Pendiente

- Nivel 5 (partida a 15).
- Pantalla para que el papá grabe las frases con su voz.
- Definir la estética (pedido explícito del papá: más adelante).
- Publicar el juego en un link.

## Cómo está armado el nivel 4

- **Práctica (4 manos):** tocar las dos cartas del mismo palo. La voz cuenta los tantos ("Veinte más 7 más 6 son 33"). La segunda mano siempre trae una figura, para explicar que vale cero.
- **Partida a 9 puntos**, con envido, real envido y truco, sin irse al mazo.
- **Ronda guiada 1:** el nene tiene 33, el carpincho le sugiere cantar envido, el zorro quiere con 28 y se ve la comparación.
- **Ronda guiada 2:** el zorro canta envido con 31; el nene tiene 6 sin par y el carpincho le sugiere no querer.
- Al querer el envido se marcan las cartas de los tantos de los dos y se dice quién gana.

## Decisiones abiertas

- Ninguna por ahora.

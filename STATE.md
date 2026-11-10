# Estado

Última actualización: 2026-11-10.

## Niveles

| Nivel | Estado |
|---|---|
| 1. Qué carta gana | Listo |
| 2. Ganar la ronda | Listo |
| 3. El truco (a 6 puntos) | Listo |
| 4. El envido | En curso |
| 5. Partida completa a 15 | Pendiente |

## Qué está verificado

- `npm test`: reglas del motor y 500 partidas completas entre bots.
- Niveles 1, 2 y 3 recorridos de punta a punta en navegador sin pantalla, en tamaño tablet y celular, sin errores de consola.

## Qué no está verificado

- **La voz.** Nunca se escuchó en un dispositivo real; los entornos de prueba no tienen audio.
- Tablets y celulares reales (solo emulación de tamaño).

## Pendiente

- Nivel 4 (envido) y nivel 5 (partida a 15).
- Pantalla para que el papá grabe las frases con su voz.
- Definir la estética (pedido explícito del papá: más adelante).
- Publicar el juego en un link.

## Decisiones abiertas

- Ninguna por ahora.

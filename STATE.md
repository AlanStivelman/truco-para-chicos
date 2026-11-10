# Estado

Última actualización: 2026-11-10.

## Niveles

| Nivel | Estado |
|---|---|
| 0. Conocer las cartas | Listo |
| 1. Qué carta gana | Listo |
| 2. Ganar la ronda | Listo |
| 3. El truco (a 6 puntos) | Listo |
| 4. El envido (práctica y partida a 9) | Listo |
| 5. Partida completa a 15 | Pendiente |

## Qué está verificado

- `npm test`: reglas del motor y 500 partidas completas entre bots.
- Niveles 0 a 4 recorridos de punta a punta en navegador sin pantalla, en tamaño tablet y celular, sin errores de consola.

## Qué no está verificado

- **La voz.** Nunca se escuchó en un dispositivo real; los entornos de prueba no tienen audio.
- Tablets y celulares reales (solo emulación de tamaño).

## Pendiente

- Nivel 5 (partida a 15).
- Pantalla para que el papá grabe las frases con su voz.
- **Aplicar la estética Truco Recreo** (ver `CONTEXT.md`): baraja ilustrada, Capi, colores, Fredoka, íconos de trazo, pantalla de niveles como camino.
- **Reemplazar al zorro y al carpincho por Capi**, también en las frases que los nombran (`zorro-*`, `n2-intro`, `n3-intro`, `n4-partida`, `partida-zorro`, `sin-par-zorro`, etc.). Antes de que el papá grabe.
- **Modo "Jugar"** desde el inicio: partida directa a 15 contra Capi (comparte casi todo con el nivel 5).
- Confirmar que el link de GitHub Pages abre bien en la tablet (https://alanstivelman.github.io/truco-para-chicos/).

## Cómo está armado el nivel 0

- **Qué es el truco:** narración corta con tres cartas en pantalla. No se puede saltear tocando al carpincho.
- **Los cuatro dibujitos:** toca espada, basto, oro y copa para escuchar el nombre.
- **La tabla en dos tramos:** primero las cuatro campeonas, después las otras diez. El lugar que sigue brilla; al tocarlo se destapan sus cartas y la voz explica. Los unos y sietes que no son campeones se aclaran.
- **Final:** puede tocar cualquier carta del segundo tramo para volver a escucharla (las campeonas ya no están en pantalla) y sigue con el botón amarillo. Siempre da 3 estrellas.

## Cómo está armado el nivel 4

- **Práctica (4 manos):** tocar las dos cartas del mismo palo. La voz cuenta los tantos ("Veinte más 7 más 6 son 33"). La segunda mano siempre trae una figura, para explicar que vale cero.
- **Partida a 9 puntos**, con envido, real envido y truco, sin irse al mazo.
- **Ronda guiada 1:** el nene tiene 33, el carpincho le sugiere cantar envido, el zorro quiere con 28 y se ve la comparación.
- **Ronda guiada 2:** el zorro canta envido con 31; el nene tiene 6 sin par y el carpincho le sugiere no querer.
- Al querer el envido se marcan las cartas de los tantos de los dos y se dice quién gana.

## Decisiones abiertas

- **Consultar la tabla desde otros niveles:** posible botón en los niveles 1 y 2. No está hecho.

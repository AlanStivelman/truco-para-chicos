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

- `npm test`: 30 pruebas, entre ellas las reglas del motor, 500 partidas completas entre bots y los grupos de la tabla del nivel 0.
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

## Para retomar

Orden recomendado:
1. **Estética Truco Recreo + Capi en lugar del zorro y el carpincho**, juntos: tocan las mismas pantallas. Incluye reescribir las frases que nombran al zorro, antes de que el papá grabe.
2. **Nivel 5 y modo "Jugar"** (comparten la partida a 15 contra Capi).
3. **Pantalla para grabar la voz.**

Recursos de diseño (se leen con la herramienta Artifact, `action: "read"`):
- Design system: https://claude.ai/artifact/9Jxb4GcrAZDWXMGJ1kU6Aa. Empezar por `project/README.md` y `project/tokens.json`.
- Mockups aprobados, fila B "Recreo" (inicio, juego, niveles, fin): https://claude.ai/artifact/SWTix64oPQV4gWZ8QuUBnF
- En el asset store del design system: la baraja (`baraja-espanola.webp`, id `d2c04ba4d621f329f582c5f866035eb6`; 2000×1278, 12 columnas del 1 al 12 × 5 filas: oros, copas, espadas, bastos y dorso en la fila 5, columna 2; recorte con `background-size: 1200% 500%` y `background-position: (col/11·100)% (fila/4·100)%`) y Capi en SVG (id `fad9e455464043557de81f73052af48c`). Copiarlos al repo, por ejemplo en `img/`.
- **Licencia de la baraja pendiente** (parece "Naipes libres"): confirmar y poner el crédito antes de publicar con ella.

Al trabajar: rama desde `main`, revisión con Fable en cambios grandes (ver `AGENTS.md`), y unir a `main` sin pedir permiso cuando se cumplen las condiciones.

## Cómo está armado el nivel 0

- **Qué es el truco:** narración corta con tres cartas en pantalla. No se puede saltear tocando al guía.
- **Los cuatro dibujitos:** toca espada, basto, oro y copa para escuchar el nombre.
- **La tabla en dos tramos:** primero las cuatro campeonas, después las otras diez. El lugar que sigue brilla; al tocarlo se destapan sus cartas y la voz explica. Los unos y sietes que no son campeones se aclaran.
- **Final:** puede tocar cualquier carta del segundo tramo para volver a escucharla (las campeonas ya no están en pantalla) y sigue con el botón amarillo. Siempre da 3 estrellas.

## Cómo está armado el nivel 4

- **Práctica (4 manos):** tocar las dos cartas del mismo palo. La voz cuenta los tantos ("Veinte más 7 más 6 son 33"). La segunda mano siempre trae una figura, para explicar que vale cero.
- **Partida a 9 puntos**, con envido, real envido y truco, sin irse al mazo.
- **Ronda guiada 1:** el nene tiene 33, el guía le sugiere cantar envido, el rival quiere con 28 y se ve la comparación.
- **Ronda guiada 2:** el rival canta envido con 31; el nene tiene 6 sin par y el guía le sugiere no querer.
- (En el código, el guía es el carpincho y el rival el zorro; con la estética nueva ambos pasan a ser Capi.)
- Al querer el envido se marcan las cartas de los tantos de los dos y se dice quién gana.

## Decisiones abiertas

- **Consultar la tabla desde otros niveles:** posible botón en los niveles 1 y 2. No está hecho.

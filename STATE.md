# Estado

Última actualización: 2026-11-10 (estética Truco Recreo y Capi).

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

- `npm test`: 34 pruebas, entre ellas las reglas del motor, 500 partidas completas entre bots, los grupos de la tabla del nivel 0 y que no falte, sobre ni nombre al zorro ninguna frase.
- Niveles 0 a 4 con la estética Truco Recreo, recorridos de punta a punta en navegador sin pantalla, en tamaño tablet (1024×768) y celular (390×844), sin errores de consola.

## Qué no está verificado

- **La voz.** Nunca se escuchó en un dispositivo real; los entornos de prueba no tienen audio.
- Tablets y celulares reales (solo emulación de tamaño).

## Pendiente

- **Licencia de la baraja** ("Naipes libres", lo dice el uno de oro): confirmarla y poner el crédito. Hasta entonces el cambio de estética no se une a `main`, que es lo que publica GitHub Pages.
- Nivel 5 (partida a 15).
- **Modo "Jugar"** desde el inicio: partida directa a 15 contra Capi (comparte casi todo con el nivel 5). Hoy el inicio solo tiene el botón Aprender: el de Jugar se suma con este modo, junto con la frase "¿Jugamos o aprendemos?" (con un id nuevo).
- Pantalla para que el papá grabe las frases con su voz.
- **Para la sesión de diseño:** quiero / no quiero (botones blancos con pulgar arriba y abajo), los puntitos de cuánto vale un canto, el marcador con puntitos en vez de números, la ficha de parda ("="), el gris de nivel cerrado (`#DCEAF2`/`#5C6F8C`) y el parlante blanco (en el design system es amarillo, pero así el único botón amarillo es el de seguir) no están en el design system.
- Confirmar que el link de GitHub Pages abre bien en la tablet (https://alanstivelman.github.io/truco-para-chicos/).

## Para retomar

Orden recomendado:
1. **Nivel 5 y modo "Jugar"** (comparten la partida a 15 contra Capi).
2. **Pantalla para grabar la voz.**

Recursos de diseño (se leen con la herramienta Artifact, `action: "read"`):
- Design system: https://claude.ai/artifact/9Jxb4GcrAZDWXMGJ1kU6Aa. Empezar por `project/README.md` y `project/tokens.json`.
- Mockups aprobados, fila B "Recreo" (inicio, juego, niveles, fin): https://claude.ai/artifact/SWTix64oPQV4gWZ8QuUBnF
- La baraja y Capi ya están en `img/` (copiados del design system). La baraja es una hoja de 12 columnas × 5 filas; `js/cartas.js` la recorta.

Al trabajar: rama desde `main`, revisión con Fable en cambios grandes (ver `AGENTS.md`), y unir a `main` sin pedir permiso cuando se cumplen las condiciones.

## Cómo está armada la mesa (niveles 2 a 4)

- Barra: mapa (vuelve a los niveles), marcador con una fila de puntitos para Capi y otra para el nene (sin números), y el parlante, que pide ayuda. Tocar a Capi también pide ayuda.
- Mesa azul: Capi a la izquierda con sus cartas boca abajo y el globo "¡Te toca!"; en el centro las tres bazas (carta de Capi arriba, la del nene abajo, ficha con quién ganó); a la derecha los botones de canto.
- Las cartas quedan en su baza hasta que termina la ronda. La baza en la que juega el nene se pinta amarilla con una flecha. La pantalla lleva su propio contador de baza (`bazaUI` en `js/app.js`): cuando se narra la carta que cierra una baza, el motor ya pasó a la siguiente.

## Cómo está armado el nivel 0

- **Qué es el truco:** narración corta con tres cartas en pantalla. No se puede saltear tocando a Capi.
- **Los cuatro dibujitos:** toca espada, basto, oro y copa para escuchar el nombre.
- **La tabla en dos tramos:** primero las cuatro campeonas, después las otras diez. El lugar que sigue brilla; al tocarlo se destapan sus cartas y la voz explica. Los unos y sietes que no son campeones se aclaran.
- **Final:** puede tocar cualquier carta del segundo tramo para volver a escucharla (las campeonas ya no están en pantalla) y sigue con el botón amarillo. Siempre da 3 estrellas.

## Cómo está armado el nivel 4

- **Práctica (4 manos):** tocar las dos cartas del mismo palo. La voz cuenta los tantos ("Veinte más 7 más 6 son 33"). La segunda mano siempre trae una figura, para explicar que vale cero.
- **Partida a 9 puntos**, con envido, real envido y truco, sin irse al mazo.
- **Ronda guiada 1:** el nene tiene 33, Capi le sugiere cantar envido, después quiere con 28 y se ve la comparación.
- **Ronda guiada 2:** Capi canta envido con 31; el nene tiene 6 sin par y Capi le sugiere no querer.
- Al querer el envido se marcan las cartas de los tantos de los dos y se dice quién gana.

## Decisiones abiertas

- **Consultar la tabla desde otros niveles:** posible botón en los niveles 1 y 2. No está hecho.

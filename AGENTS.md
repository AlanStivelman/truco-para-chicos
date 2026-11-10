# Instrucciones para agentes

Leé también `CONTEXT.md` (qué es y por qué) y `STATE.md` (en qué punto está) antes de trabajar.

## Idioma

Todo en español rioplatense: código, comentarios, mensajes de commit, pull requests y textos para el usuario.

## Reglas del proyecto

- **Nada que haga falta para jugar puede depender de leer.** Toda instrucción nueva va como frase en `js/frases.js` y se dice con `Voz.decir(id)`. Nunca texto en pantalla como única vía.
- **Las frases se graban.** Cada frase nueva necesita un id estable y corto. No reutilizar un id para otro texto: rompería la grabación que ya existe.
- **El motor no toca la pantalla.** `js/mazo.js`, `js/motor.js` y `js/bot.js` no usan `document`, `window` ni `Voz`, y funcionan en Node.
- **Toda regla nueva o cambiada en el motor lleva prueba** en `test/`.
- **No invertir en estética** sin que el papá lo pida: está pendiente de definir.
- Sin dependencias ni paso de compilación, salvo que se acuerde.

## Cómo verificar

```bash
npm test
```

Para la pantalla: servir la carpeta (`python3 -m http.server`) y abrir con `?silencio` para que no hable. Recorrer el nivel tocado en tamaño tablet (1024×768) y celular (390×844) sin errores de consola.

La voz real no se puede escuchar en entornos sin audio: decirlo siempre en vez de darla por probada.

## Revisión de código con Fable (obligatoria en cambios grandes)

Un **cambio grande** es cualquiera de estos:

- Un nivel nuevo o un cambio de flujo en uno existente.
- Cualquier cambio en `js/motor.js` o `js/bot.js`.
- Más de unas 150 líneas cambiadas en total.

Para un cambio grande, **antes de commitear** el código:

1. **Revisión del plan.** Antes de escribir código, escribir un plan corto (qué se cambia, en qué archivos, qué reglas toca) y pedírselo revisar a un agente revisor con el modelo **Fable** (`claude-fable-5-2`). Ajustar el plan según lo que encuentre.
2. **Revisión del código.** Con el código escrito y las pruebas pasando, pero **sin commitear**, pedirle al revisor Fable que revise el diff (`git diff`) contra el plan y las reglas de `CONTEXT.md`.
3. **Corregir** lo que el revisor confirme como problema real. Si algo no se corrige, anotar por qué en el pull request.
4. Recién ahí commitear y pushear.

El revisor está definido en `.claude/agents/revisor-fable.md`. Si la herramienta no lo carga, usar un agente general con el modelo Fable y las mismas instrucciones. Al revisor se le pasa el código y el plan, no las conclusiones propias: tiene que leer el código por su cuenta.

Los cambios chicos (una frase, un ajuste de estilo, un arreglo de una línea) no necesitan revisión.

## Git

- Trabajar en una rama, nunca directo en `main`.
- Abrir un pull request por rama.
- Al terminar cada cambio, actualizar `STATE.md`.
- **Unir a `main` no requiere pedir permiso** (lo autorizó el papá el 2026-11-10). Se une el pull request cuando se cumplen las tres condiciones: `npm test` pasa, el cambio está verificado en navegador y, si es un cambio grande, pasó las dos revisiones de Fable con sus hallazgos corregidos o anotados en el pull request.

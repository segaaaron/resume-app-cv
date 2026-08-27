# El contrato del ATS — cómo tiene que comportarse

Este documento existe porque el plan anterior vivía en `scratchpad/`, que el
proyecto borra, y se perdió. Todo lo de acá está **verificado contra el código**
el 2026-08-27, no recordado.

## La regla que manda (CEO)

> Si te sugiero un merge, eliminar o cambiar un bullet, **no te contradigas más
> tarde**.

De ahí salen las cuatro invariantes de abajo. Cada una nombra el archivo que la
posee. Si una respuesta se puede dar en dos lugares, es un defecto, aunque los
dos coincidan hoy.

## 1 · Un número, un dueño

**¿Cuántas viñetas admite un puesto?** → `lib/ats/role-budget.ts`, que lee
`BULLETS_PER_ROLE_MIN`/`MAX` de `lib/ats/scoring-config.ts`.

Hoy: **3 a 6 para todo puesto**, sin distinguir antigüedad. El editor
(`WorkExperience.tsx`) aplica el mismo techo y lo anuncia en su ayuda.

Ninguna capa puede guardar un tope propio. Una banda más estricta río abajo
significa pedirle al usuario que borre la línea que el editor le acaba de
aceptar — que es exactamente el bucle reportado el 2026-08-25 y el 2026-08-27.

## 2 · El índice es pista, el texto es identidad

Dueño: `lib/ats/bullet-locate.ts` (`resolveBulletIndex`).

Todo lo que se calcula en el análisis y se reusa después **viaja con el texto de
la línea que señala**, nunca sólo con su posición. Aplicar un arreglo borra o
mueve líneas, y desde ese momento toda posición guardada apunta a otra cosa.

Los tres canales, todos con su texto:

| Qué viaja | Campo | Se resuelve en |
|---|---|---|
| Par de fusión | `SemanticPair.texts` | `merge-candidates.ts` |
| Par de repetición | `RepeatedPair.a.text` / `b.text` | `writing-checks.ts` |
| Hallazgo del reclutador | `CvFixAction.originalText` | `recruiter-verified.ts` |

Reglas de borde:

- El texto se adjunta **en el servidor**, único punto sin deriva posible, y se
  re-adjunta también en los aciertos de caché (`groundForThisResume`).
- Debe estar **declarado en el schema Zod** del borde HTTP: Zod descarta en
  silencio lo que no declara, y el campo borrado devuelve el defecto entero.
- Si la línea ya no se puede ubicar, el hallazgo **se descarta**. Nunca se
  señala una línea distinta, y nunca se muestra un botón que escribiría en el
  renglón equivocado.

## 3 · Aplicado es aplicado, y no aplicado no se marca

Dueños: `lib/ats/applied-checks.ts` (la huella) y `lib/ats/applied-memory.ts`
(la firma del texto aceptado, que sobrevive al análisis siguiente).

- Un hallazgo cerrado **sigue cerrado** cuando llega un análisis nuevo. Vaciar
  las marcas al re-analizar devuelve al usuario los arreglos que ya hizo — se
  escribió dos veces, con dos nombres distintos, y las dos veces fue un bug.
- Un hallazgo que vuelve **describiendo otra cosa** recupera su botón solo: eso
  lo decide la huella, no un reset.
- **Nada se marca como aplicado si no se escribió.** Que la línea señalada no
  aparezca no es "ya está resuelto": si no se sabe cuál era, es un error y se
  dice como error.

## 4 · Un hallazgo dice quién lo dice y si mueve el puntaje

- `owner` distingue quién resuelve: `tailor` escribe el texto, `auto` es
  determinista, `user` es un dato que sólo tiene el candidato.
- Las acciones del panel (`set_title`, `weave_term`, `strip_glyphs`) **no las
  puede pedir el modelo**: `rejectionOf` las descarta como `panel_only_action`.
- El rótulo de una sección no puede atribuir a un reclutador lo que calcula el
  código, ni afirmar que no mueve el puntaje si sus tarjetas llevan peso.

## 5 · Un defecto que el detector no ve no existe para nadie

Medido de punta a punta el 2026-08-27 con el CV reportado, cuya línea decía
`Active use of AI-assisted development tools…`:

```
weakVerbBullets : []        isImprovableLine : NO   ← el producto era ciego
```

Y la ceguera se propaga entera: sin defecto no hay tarjeta, sin tarjeta el
ejecutor nunca recibe la línea, y si el reclutador la señala `rejectionOf` la
descarta como `line_has_no_defect`. Nadie la arregla nunca.

Tres causas encadenadas, las tres cerradas:

1. **`WEAK_OPENERS` enumera frases**, y la lista siguiente siempre llega tarde.
   La regla se **deriva** de la gramática: `opensNominally` pregunta si la línea
   arranca con un sintagma nominal en vez de con el verbo del trabajo, usando
   listas cerradas de determinantes y preposiciones. Medido sobre 21 líneas en
   dos idiomas: **6 de 6 detectadas, 0 falsos positivos**. La ventana de la
   preposición es de dos palabras y ese número salió de la medición — con tres,
   «Reduje el tiempo DE cierre contable» caía como nominal.
2. **La pregunta tenía cuatro dueños**: `opensWeak`, `opensWeakly`,
   `isImprovableLine` y `bulletsOf`, cada uno con su copia de
   `WEAK_OPENERS.some(startsWith)`. Uno aprendió algo nuevo y los otros
   siguieron ciegos. Hoy contesta `opensWeakly` y sólo él.
3. **`weakVerbBullets` no tenía consumidor**: se calculaba en cada análisis y
   nadie lo leía. La única tarjeta que preguntaba por líneas flojas salía de
   `rankRoleBullets`, o sea de las que CAEN del ranking de su puesto — así que
   una línea mal escrita sólo recibía atención si además el puesto estaba
   sobrecargado. Ahora tiene tarjeta propia (`tips.weak_opener`), con tope y
   respetando «una viñeta, un lugar».

## Lo que se midió contra la API real, y qué se cayó

Tres hipótesis, dos descartadas por la medición:

| Sospechoso | Resultado |
|---|---|
| `improve-bullet` prefija el verbo | **0 de 4**. Reescribe bien: «Active use of…» → «Accelerated Swift and SwiftUI refactoring…» |
| El tejedor de habilidades lo escribe | **0 de 4**. Escribe bien: «Conducted Code Review for Swift…» |
| El ejecutor lo arregla si se lo pides | **No lo toca**: devuelve `rewrites: []` sin descartes, incluso con `reason: "weak_verb"` |

De ahí la conclusión: el motor que arregla esta forma es `improve-bullet`, y es
el que la tarjeta nueva termina llamando. El defecto nunca fue que el modelo
escribiera mal — era que nadie le pedía arreglar esa línea.


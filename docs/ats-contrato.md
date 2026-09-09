# El contrato del ATS — cómo tiene que comportarse

Este documento existe porque el plan anterior vivía en `scratchpad/`, que el
proyecto borra, y se perdió.

**Reescrito el 2026-09-08 contra `lib/ats3`, verificado archivo por archivo.** La
versión anterior estaba fechada el 2026-08-27 y nombraba como dueños de sus
invariantes a seis módulos que el borrado del motor viejo (2026-08-29) se llevó:
`applied-checks`, `applied-memory`, `recruiter-verified`, `build-report`,
`panel-report` y `report`. Las invariantes seguían siendo correctas; los dueños
ya no existían. Un documento de intención que nombra archivos borrados es peor
que ninguno, porque la próxima auditoría lo usa de vara y mide contra un motor
que no está.

## La regla que manda (CEO)

> Si te sugiero un merge, eliminar o cambiar un bullet, **no te contradigas más
> tarde**.

> El ATS muestra lo que falta, **tailor lo soluciona**. Sin nada que se
> contradiga ni se repita.

De ahí salen las invariantes de abajo. Cada una nombra el archivo que la posee.
Si una respuesta se puede dar en dos lugares, es un defecto, aunque los dos
coincidan hoy.

## Las piezas, y son éstas

```
lib/ats3/contracts.ts   vocabulario, ids, hashes, esquemas Zod
lib/ats3/engine.ts      8 fases, 5 capas de caché, parches sobre copia
lib/ats3/guards.ts      los 12 chequeos + lealtad + reintento
lib/ats3/ledger.ts      memoria entre viñetas + presupuesto de espacio
lib/ats3/score.ts       puntaje aditivo + semáforo
```

Fuera de los cinco: `lib/services/ai/modules/AIAts3Module.ts` (los 6 prompts),
`app/api/ai/ats3/route.ts` (el único borde) y `components/editor/ats3/`
(6 archivos). **El ATS v3 no importa nada de `lib/ats/`** — el motor viejo sigue
existiendo con 19 módulos porque los usan la carta, `/tools/ats-checker`, la
plantilla ATS y el asistente, que no son éste.

## 1 · Un número, un dueño

- **¿Cuánto vale cerrar esto?** → `score.ts`. `gainOf` devuelve el
  `gainPerUnit` del mismo objeto que pinta el dial: no hay una segunda fórmula,
  así que la tarjeta y el número no pueden discrepar.
- **¿De qué color va?** → `scoreBand` en `score.ts` (<55 rojo · 55-79 amarillo ·
  ≥80 verde). El color dice el PUNTAJE y nada más; lo crítico lo dice el
  veredicto, que además exige cero críticos abiertos para decir «listo».
- **¿Cuánto se puede recuperar?** → `view-model.ts`, acotado al techo real
  (`min(suma, 100 - total)`): el dial no puede prometer puntos imposibles.
- **¿Cuántas cosas hay que hacer?** → una sola expresión,
  `workOf(secciones).length + verdictsToDo(triage).length`, y la usan el botón
  del informe y la pestaña de Tailor. Dos cifras ciertas que cuentan cosas
  distintas se leen como una mentira.

## 2 · El índice es pista, el texto es identidad

Dueño: `buildTree` y `bulletIdFor`/`roleIdFor` en `contracts.ts`.

Los ids se derivan del TEXTO dentro de su puesto, no de la posición. Aplicar un
arreglo reordena las líneas, y un id posicional convertiría cada hallazgo
guardado en un puntero a la línea equivocada.

- La sugerencia viaja con `originalText` y `basedOnHash` (`AnchoredSuggestion`).
  Una reescritura que no sabe a qué línea reemplaza **no se publica**.
- `isStale` compara el hash al aplicar: una propuesta pensada sobre una versión
  vieja no pisa la edición que el usuario hizo mientras esperaba.
- Dos puestos idénticos se desempatan (`roleIdFor`), o al escribir de vuelta uno
  pisa al otro y desaparecen las viñetas de un trabajo entero.

## 3 · Cada clave de caché nombra TODO de lo que depende su respuesta

Dueño: `cacheKey` en `engine.ts`. Cinco capas: `ats3-jd`, `ats3-audit`,
`ats3-triage`, `ats3-fix`, `ats3-log`.

Una clave incompleta es peor que no tener caché: sirve la respuesta de otra
pregunta. `treeHash` cubre viñetas, resumen, **cargo, empresa, fechas y
habilidades declaradas** — las cuatro últimas se agregaron el 2026-09-08, porque
`compactTree` se las manda al modelo y la clave no las miraba: corregir el cargo
no movía el puntaje durante 30 días.

**Lo guardado vuelve a pasar por los guards.** Un guard nuevo tiene que valer
para lo ya guardado o no vale: una propuesta escrita antes de que el chequeo
existiera lo esquivaría para siempre.

## 4 · Aplicado es aplicado, y no aplicado no se marca

Dueños: `loyalty` en `guards.ts` (qué se vuelve a mostrar) y el registro
`ats3-log` (qué se cerró).

- Un hallazgo cerrado **sigue cerrado** cuando llega un análisis nuevo.
- Un hallazgo que vuelve **describiendo otra cosa** se avisa como regresión: lo
  decide el `nodeHash`, no un reset.
- **Se anota el hallazgo que se cerró, no la línea entera.** Con dos tarjetas
  sobre una viñeta, anotar por línea mataba la hermana — y descartada a mano no
  volvía nunca. Sin `findingId` se anota la línea, que es lo correcto en el único
  caso donde eso es cierto: cuando la viñeta deja de existir.
- **Nada se marca como aplicado si no se escribió.** `addSkill` devuelve si
  escribió; una función que no lo dice hace mentir a quien la llama.
- La identidad de un hallazgo es `nodo + tipo` (+ un matiz cuando dos comparten
  los dos, como los siete chequeos de lectura).

## 5 · Un hallazgo declara su remedio, y la pantalla sólo traduce

`rewrite` · `weave` · `add_skill`. La pantalla no adivina cómo se cierra: si lo
adivinara volvería a decir «reescribí esta línea» para todo, y reescribir la
línea de 2015 no la desentierra.

- **El triage manda sobre la línea.** `KEEP` y `DROP` cierran cualquier hallazgo
  sobre esa viñeta: pedir una mejora sobre una de las dos es contradecirse en la
  misma pantalla.
- **Ningún veredicto sin botón.** Un `REPLACE` sin su pregunta degrada a
  `REWRITE` al leer la respuesta: el campo es nulable y sólo lo pedía un renglón
  del prompt, y un prompt es una petición, no un contrato.
- **Un componente que puntúa sin hallazgos que lo nombren no tiene sección.** El
  cargo (`title`) pesa y se mide, y ninguna tarjeta puede moverlo: por eso ya no
  hay una sección «Que te encuentren» pintando un porcentaje sin nada debajo.

## 6 · Ningún camino escribe en el CV sin pasar por los guards

Dueño: `checkSuggestion` en `guards.ts`, con sus 12 razones: `invented_term` ·
`invented_figure` · `wrong_person` · `verb_collision` · `keyword_over_budget` ·
`duplicate_claim` · `drops_content` · `adds_nothing` · `too_many_placeholders` ·
`placeholder_in_summary` · `stale` · `empty`.

- La **variante sin cifra** —lo que se escribe al pulsar «no tengo ese dato»—
  pasa por los mismos chequeos: es la puerta que más tienta a borrar la cifra que
  el candidato sí dio.
- Un rechazo **dice cuál fue**: «no se pudo» con el uso ya cobrado es lo que hace
  que alguien deje de apretar el botón.
- **Un reintento, nunca dos** por motivo. Dos esconden un prompt que dejó de
  funcionar. El techo del camino completo son seis llamadas y está contado en
  `runRewrite`.
- **El prompt y el guard dicen lo mismo.** P4 le exige al modelo que alguna
  palabra del término ya esté en la línea; `inventedTerms` lo hace cumplir. Si
  discrepan, gana el código.

## 7 · La cuota se cobra por petición, y lo que no se gastó se devuelve

- Una petición, una cuota, aunque la entrega venga en cinco actos NDJSON.
- El stream se abre **después** del primer acto: un 403, un 429 o un 422 dentro
  de un 200 dejarían al panel en blanco en vez del aviso correcto.
- `calls === 0` → `refundDailyQuota`. Una corrida servida entera del caché no
  gastó nada.
- **Una fila por petición** en `AIUsageLog`: el panel agrupa por conteo, y seis
  prompts en seis filas figurarían como seis llamadas.
- Registrar lo resuelto **no gasta cuota**: es una escritura, no una llamada.
- **El CV tiene que ser suyo.** `requireUser` autentica a la persona; el
  `resumeId` llega en el cuerpo y se comprueba con el mismo `where` que usa
  `ResumeService`. Va dentro del `try`, porque `handleError` es lo que escribe la
  falla en el panel de Service Errors.

## Lo que este contrato NO promete

- **La lectura del PDF renderizado no participa del puntaje.** El esquema acepta
  un campo `checks` para eso y el panel manda `{}` siempre: el pilar se calcula
  con `readableChecks`, que deriva de los datos estructurados. Queda dicho para
  que nadie lea el campo como una defensa que existe.
- **Una viñeta que la auditoría no devuelve no recibe hallazgo.** Falla callado a
  propósito: rellenar los ejes que el modelo no juzgó sería fabricar un juicio
  sobre una línea que nadie leyó.
- **Las blandas no puntúan**, por decisión de producto. La sección lo declara y
  la tarjeta lo dice.

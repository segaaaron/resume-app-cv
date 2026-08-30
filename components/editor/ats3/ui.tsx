"use client"

// components/editor/ats3/ui.tsx
//
// EL VOCABULARIO VISUAL DE LA PESTAÑA ATS. Una forma, un dueño, N usos.
//
// ── POR QUÉ ESTE ARCHIVO EXISTE (orden del CEO, 2026-08-30) ─────────────────
// El motor viejo murió de lo contrario: un módulo nuevo por cada defecto, y al
// final 59 módulos que nadie podía sostener. La regla que lo reemplaza es
// simple: cuando algo se repite, no se copia ni se le hace un archivo propio —
// se generaliza UNA vez y se usa N veces.
//
// Lo que se midió antes de escribir esto, sobre las tres pantallas de la
// pestaña (2.599 líneas): 8 pastillas, 9 cajas, 5 rótulos, 18 botones y 14
// fichas, cada una con sus clases y sus tokens escritos a mano. Cincuenta y
// cuatro copias de cinco formas. Un tono nuevo obligaba a tocar los cincuenta y
// cuatro sitios, y por eso los colores del veredicto se habían quedado en
// literales de Tailwind mientras el resto ya usaba tokens.
//
// ── LA PIEZA QUE HACE QUE ESTO ESCALE ───────────────────────────────────────
// No son los componentes: es `TONE`. Un solo mapa de SIGNIFICADO a tokens —lo
// que está bien, lo que avisa, lo que rompe, lo que hace la IA, lo que acentúa—
// del que salen la pastilla, la caja, la ficha y el botón. Agregar un estado
// nuevo es una línea acá, no una decisión repetida en cada pantalla.
//
// Nada de esto decide nada del producto: no puntúa, no juzga, no llama a nadie.
// Es cómo se ve lo que otros ya midieron.

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"

/**
 * EL LENGUAJE DE PULSACIÓN, y vive acá porque lo usan las tres pantallas.
 *
 * `brightness` funciona sobre CUALQUIER fondo —los del panel son tokens— así
 * que un solo gesto sirve para el botón sólido, el de contorno y el mudo, sin
 * quince decisiones distintas. Y va junto con `transition-[filter,transform]`
 * a propósito: con un `transition-opacity` suelto al lado, en Tailwind gana el
 * que el CSS ordene último y el efecto se anula sin que nada falle.
 */
export const PRESSABLE =
  "transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"

/**
 * QUÉ SIGNIFICA, no de qué color es.
 *
 * Se nombra por lo que la cosa ES —está bien, avisa, rompe, lo escribe la IA,
 * es el acento— para que la pantalla no tenga que saber qué token le toca. El
 * día que un tono cambie, cambia acá y en ningún otro lado.
 */
export type Tone = "neutral" | "accent" | "ok" | "warn" | "bad" | "ai"

interface ToneTokens {
  /** Fondo suave: pastillas, fichas y avisos. */
  soft: string
  /** Tinta legible SOBRE ese fondo suave. Medida contra AA en el panel. */
  ink: string
  /** El color pleno: bordes marcados y botones sólidos. */
  solid: string
  /** Tinta sobre el color pleno. */
  onSolid: string
}

const TONE: Record<Tone, ToneTokens> = {
  neutral: { soft: "var(--a-surface-3)", ink: "var(--a-ink-2)", solid: "var(--a-border)", onSolid: "var(--a-ink)" },
  accent: { soft: "var(--a-accent-soft)", ink: "var(--a-accent-ink)", solid: "var(--a-accent-ink)", onSolid: "#FFFFFF" },
  ok: { soft: "var(--a-ok-soft)", ink: "var(--a-ok-ink)", solid: "var(--a-ok)", onSolid: "#FFFFFF" },
  warn: { soft: "var(--a-warn-soft)", ink: "var(--a-warn-ink)", solid: "var(--a-warn)", onSolid: "#FFFFFF" },
  bad: { soft: "var(--a-bad-soft)", ink: "var(--a-bad-ink)", solid: "var(--a-bad)", onSolid: "#FFFFFF" },
  ai: { soft: "var(--a-ai-soft)", ink: "var(--a-ai-ink)", solid: "var(--a-ai)", onSolid: "#FFFFFF" },
}

/** Los tokens de un tono, para lo que no encaje en estas piezas. */
export function toneOf(tone: Tone): ToneTokens {
  return TONE[tone]
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PASTILLA. Un dato corto que se lee de un vistazo: puntos, veredicto,
 * estado, insignia.
 *
 * `tabular-nums` siempre: la mitad de las pastillas de esta pestaña llevan
 * números y una cifra que baila al actualizarse se lee como un error.
 */
export function Chip({
  tone = "neutral",
  size = "sm",
  children,
  className = "",
}: {
  tone?: Tone
  /** `xs` para las insignias que acompañan a un título; `sm` para el resto. */
  size?: "xs" | "sm"
  children: ReactNode
  className?: string
}) {
  const t = TONE[tone]
  const dims = size === "xs" ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10.5px]"
  return (
    <span
      className={`inline-block rounded-full font-bold tabular-nums ${dims} ${className}`}
      style={{ background: t.soft, color: t.ink }}
    >
      {children}
    </span>
  )
}

/**
 * LA CAJA. Todo lo que es una unidad que se lee junta: una tarjeta, una
 * sección, la ventana.
 *
 * El tono pinta el BORDE y no el fondo: una tarjeta resuelta se distingue por
 * su marco, no tiñendo el texto que el usuario tiene que poder leer. La
 * excepción se pide con `filled`, para las que sí son un estado entero.
 */
export function Card({
  tone = "neutral",
  filled = false,
  radius = "xl",
  children,
  className = "",
  style,
}: {
  tone?: Tone
  filled?: boolean
  radius?: "lg" | "xl" | "2xl"
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const t = TONE[tone]
  /* Las clases se nombran ENTERAS: Tailwind lee el archivo como texto, así que
     una armada por concatenación (`rounded-${radius}`) no existe para él y se
     purga — el borde redondeado desaparece en producción sin fallar en
     desarrollo, que es el peor tipo de fallo. */
  const RADIUS = { lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl" } as const
  return (
    <div
      className={`${RADIUS[radius]} border ${className}`}
      style={{
        borderColor: tone === "neutral" ? "var(--a-border)" : t.solid,
        background: filled ? t.soft : "var(--a-surface)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * EL RÓTULO de un bloque: «DICE AHORA», «QUEDARÍA», «FALTAN EN TU CV».
 *
 * Diminuto y espaciado a propósito: nombra sin competir con lo nombrado.
 */
export function Label({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <p
      className="text-[9.5px] font-bold uppercase tracking-wide"
      style={{ color: tone === "neutral" ? "var(--a-muted-2)" : TONE[tone].ink }}
    >
      {children}
    </p>
  )
}

/**
 * LA FICHA / EL AVISO: un texto con fondo propio.
 *
 * Es la forma que más se repetía —evidencia, pistas, la línea que un veredicto
 * señala, el aviso de que algo se sacó— y cada copia elegía sus clases. Envuelve
 * y no corta (`[overflow-wrap:anywhere]`) porque casi siempre lleva texto del
 * CV, y el dato que importa suele estar al final: con `truncate` la ficha de un
 * hallazgo de fechas se comía justo el año.
 */
export function Note({
  tone = "neutral",
  strike = false,
  size = "sm",
  children,
  className = "",
  ...resto
}: {
  tone?: Tone
  /** Lo que va a desaparecer se lee como lo que va a desaparecer. */
  strike?: boolean
  /**
   * `xs` la pastilla compacta del riel del informe, que mide ~320px y donde
   * varias fichas apiladas con el espaciado normal empujan el resto fuera de la
   * pantalla · `sm` la ficha de una tarjeta · `md` el texto que ENTRA al CV, que
   * es lo que el usuario va a aceptar y merece leerse cómodo.
   */
  size?: "xs" | "sm" | "md"
  children: ReactNode
  className?: string
  /**
   * Lo que el DOM necesita y esta pieza no tiene por qué conocer: `role="alert"`
   * para que un lector de pantalla anuncie un error, o la referencia con la que
   * la pantalla se lleva la vista hasta acá. Enumerarlos uno por uno haría que
   * cada necesidad nueva obligue a tocar este archivo — que es exactamente lo
   * que este archivo existe para evitar.
   */
} & Omit<ComponentPropsWithRef<"p">, "children" | "className">) {
  const t = TONE[tone]
  return (
    <p
      {...resto}
      className={`leading-relaxed [overflow-wrap:anywhere] ${
        size === "xs"
          ? "rounded-md px-2 py-1 text-[10.5px] font-medium"
          : size === "md"
            ? "rounded-lg px-3 py-2 text-[13px] font-medium"
            : "rounded-lg px-3 py-2 text-[11.5px]"
      } ${strike ? "line-through decoration-1" : ""} ${className}`}
      style={{ background: t.soft, color: t.ink }}
    >
      {children}
    </p>
  )
}

/**
 * EL BOTÓN, en las tres formas que esta pestaña usa de verdad.
 *
 *   solid    la acción principal de su bloque
 *   outline  la alternativa que no es la principal
 *   quiet    la salida discreta: descartar, cancelar
 *
 * `min-h-[36px]` como piso: por debajo, en un teléfono, el dedo falla y el
 * usuario cree que el botón no responde.
 */
export function Btn({
  tone = "accent",
  variant = "solid",
  disabled,
  onClick,
  children,
  className = "",
  ariaLabel,
}: {
  tone?: Tone
  variant?: "solid" | "outline" | "quiet"
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  const t = TONE[tone]
  const style: CSSProperties =
    variant === "solid"
      ? { background: t.solid, color: t.onSolid }
      : variant === "outline"
        ? { border: "1px solid var(--a-border)", background: "var(--a-surface)", color: t.ink }
        : { color: "var(--a-muted-2)" }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${PRESSABLE} flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-3 text-[11.5px] font-bold ${className}`}
      style={style}
    >
      {children}
    </button>
  )
}

/**
 * EL ANTES Y EL DESPUÉS.
 *
 * Vive acá porque lo piden dos pantallas —la confirmación antes de escribir y la
 * tarjeta de lo ya resuelto— y las dos tienen que enseñar EXACTAMENTE lo mismo:
 * si difieren, una de las dos le está mintiendo al usuario sobre lo que quedó en
 * su CV. Lo viejo se lee como lo que se va y lo nuevo como lo que queda; con el
 * mismo peso tipográfico había que adivinar cuál era cuál.
 */
export function Diff({
  beforeLabel,
  before,
  afterLabel,
  after,
  tone = "accent",
}: {
  beforeLabel: ReactNode
  before: string
  afterLabel: ReactNode
  after: string
  tone?: Tone
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label>{beforeLabel}</Label>
        <p
          className="text-[12px] leading-relaxed line-through decoration-1 [overflow-wrap:anywhere]"
          style={{ color: "var(--a-muted)" }}
        >
          {before}
        </p>
      </div>
      <div>
        <Label tone={tone}>{afterLabel}</Label>
        <Note tone={tone} size="md" className="mt-0.5">
          {after}
        </Note>
      </div>
    </div>
  )
}

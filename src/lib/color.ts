/** github-readme-stats accepts 3/4/6/8-digit hex without the leading `#`. */
const HEX_RE = /^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export const normalizeHex = (s: string) => s.trim().replace(/^#/, "").toLowerCase()
/** Drops the `#` from a color or from every stop of an `angle,c1,c2` gradient (the card adds it back). */
export function stripHash(value: string) {
  return value
    .split(",")
    .map(part => part.trim().replace(/^#/, ""))
    .join(",")
}
export const isHex = (s: string) => HEX_RE.test(normalizeHex(s))

/** Expand 3/4-digit shorthand to 6/8 digits. */
export function expandHex(hex: string) {
  const h = normalizeHex(hex)
  return h.length <= 4 ? h.split("").map(c => c + c).join("") : h
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Channels 0–255, alpha 0–1. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

/** Hue 0–360, saturation/lightness 0–100, alpha 0–1. */
export interface Hsla {
  h: number
  s: number
  l: number
  a: number
}

export function hexToRgba(hex: string): Rgba | null {
  if (!isHex(hex))
    return null
  const h = expandHex(hex)
  const byte = (i: number) => Number.parseInt(h.slice(i, i + 2), 16)
  return { r: byte(0), g: byte(2), b: byte(4), a: h.length === 8 ? byte(6) / 255 : 1 }
}

/** Alpha is only emitted when the color isn't fully opaque. */
export function rgbaToHex({ r, g, b, a }: Rgba) {
  const byte = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")
  const alpha = Math.round(clamp(a, 0, 1) * 255)
  return byte(r) + byte(g) + byte(b) + (alpha < 255 ? byte(alpha) : "")
}

export function rgbaToHsla({ r, g, b, a }: Rgba): Hsla {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === rn)
      h = ((gn - bn) / d) % 6
    else if (max === gn)
      h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
  }
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100, a }
}

export function hslaToRgba({ h, s, l, a }: Hsla): Rgba {
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r1, g1, b1]
    = hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x]
  const m = ln - c / 2
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255, a }
}

export interface Gradient {
  angle: number
  stops: string[]
}

/** Parse the card's `angle,c1,c2,...` background syntax. */
export function parseGradient(value: string): Gradient | null {
  const parts = value.split(",").map(p => p.trim())
  if (parts.length < 3 || !/^-?\d+(?:\.\d+)?$/.test(parts[0]))
    return null
  return { angle: Number(parts[0]), stops: parts.slice(1).map(normalizeHex) }
}

export const serializeGradient = (g: Gradient) => [g.angle, ...g.stops].join(",")

/**
 * CSS equivalent of a card color value. The card rotates a left→right SVG
 * gradient by `angle` clockwise, which is CSS's 90deg + angle.
 */
export function toCssBackground(value: string): string | undefined {
  const g = parseGradient(value)
  if (g) {
    const stops = g.stops.map(s => (isHex(s) ? `#${s}` : "transparent"))
    return `linear-gradient(${90 + g.angle}deg, ${stops.join(", ")})`
  }
  return isHex(value) ? `#${normalizeHex(value)}` : undefined
}

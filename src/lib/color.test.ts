import { describe, expect, it } from "vitest"

import {
  expandHex,
  hexToRgba,
  hslaToRgba,
  isHex,
  parseGradient,
  rgbaToHex,
  rgbaToHsla,
  serializeGradient,
  stripHash,
  toCssBackground,
} from "./color"

describe("hex", () => {
  it("accepts 3/4/6/8 digits with or without #", () => {
    for (const ok of ["fff", "#fff", "ffff", "ff8800", "#FF8800", "ff880080"]) expect(isHex(ok)).toBe(true)
    for (const bad of ["", "ff", "fffff", "ggg", "#ff880"]) expect(isHex(bad)).toBe(false)
  })
  it("expands shorthand", () => {
    expect(expandHex("#f80")).toBe("ff8800")
    expect(expandHex("f80a")).toBe("ff8800aa")
    expect(expandHex("ff8800")).toBe("ff8800")
  })
  it("converts to and from rgba, emitting alpha only when translucent", () => {
    expect(hexToRgba("ff8800")).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(hexToRgba("ff880080")?.a).toBeCloseTo(128 / 255)
    expect(hexToRgba("nope")).toBeNull()
    expect(rgbaToHex({ r: 255, g: 136, b: 0, a: 1 })).toBe("ff8800")
    expect(rgbaToHex({ r: 255, g: 136, b: 0, a: 0.5 })).toBe("ff880080")
  })
})

describe("hsl", () => {
  it("round-trips through rgba", () => {
    const rgba = { r: 255, g: 136, b: 0, a: 1 }
    const hsla = rgbaToHsla(rgba)
    expect(hsla.h).toBeCloseTo(32)
    expect(hsla.s).toBeCloseTo(100)
    expect(hsla.l).toBeCloseTo(50)
    const back = hslaToRgba(hsla)
    expect(back.r).toBeCloseTo(255)
    expect(back.g).toBeCloseTo(136)
    expect(back.b).toBeCloseTo(0)
  })
})

describe("gradient", () => {
  it("parses the card's angle,c1,c2 syntax and normalizes stops", () => {
    expect(parseGradient("90, #2F80ED, a855f7")).toEqual({ angle: 90, stops: ["2f80ed", "a855f7"] })
    expect(parseGradient("2f80ed")).toBeNull()
    expect(parseGradient("abc,def,123")).toBeNull()
  })
  it("serializes back", () => {
    expect(serializeGradient({ angle: 45, stops: ["fff", "000"] })).toBe("45,fff,000")
  })
  it("strips # from a color or every stop", () => {
    expect(stripHash("#ff8800")).toBe("ff8800")
    expect(stripHash("90,#2f80ed, #a855f7")).toBe("90,2f80ed,a855f7")
    expect(stripHash("90,")).toBe("90,")
  })
  it("maps to CSS with the card's rotation", () => {
    expect(toCssBackground("ff8800")).toBe("#ff8800")
    expect(toCssBackground("90,2f80ed,zzz")).toBe("linear-gradient(180deg, #2f80ed, transparent)")
    expect(toCssBackground("not a color")).toBeUndefined()
  })
})

import { describe, expect, it } from "vitest"

import en from "./en.json"
import ja from "./ja.json"
import zh from "./zh.json"

/** Dotted leaf paths of a nested JSON object. */
function keysOf(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix.slice(0, -1)]
  return Object.entries(obj).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
}

// AGENTS.md: keep the key set identical across locale files.
describe("locales", () => {
  const reference = keysOf(en).sort()
  it.each([
    ["zh", zh],
    ["ja", ja],
  ])("%s has exactly the keys of en", (_, locale) => {
    expect(keysOf(locale).sort()).toEqual(reference)
  })

  it("has no empty strings", () => {
    for (const [name, locale] of Object.entries({ en, zh, ja })) {
      const empty = keysOf(locale).filter((k) =>
        k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], locale) === "",
      )
      // Blank overrides under cardParams are a feature (they hide the shared text).
      expect(empty.filter((k) => !k.startsWith("cardParams.")), name).toEqual([])
    }
  })
})

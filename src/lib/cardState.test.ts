import type { StoredState } from "./cardState"
import { describe, expect, it } from "vitest"

import { applyUrlState, fromStored, sameValues, seedValues, splitCommon } from "./cardState"

function stateWith(patch: Partial<StoredState>): StoredState {
  return {
    values: seedValues(),
    common: {},
    ownStyle: {},
    ...patch,
  }
}

describe("splitCommon / sameValues", () => {
  it("separates style params from the card's own", () => {
    expect(splitCommon({ username: "x", theme: "dark", hide: ["stars"], bg_color: "fff" })).toEqual({
      own: { username: "x", hide: ["stars"] },
      common: { theme: "dark", bg_color: "fff" },
    })
  })
  it("ignores unset entries when comparing", () => {
    expect(sameValues({ theme: "dark", title_color: "" }, { theme: "dark", bg_color: undefined })).toBe(true)
    expect(sameValues({ theme: "dark" }, { theme: "light" })).toBe(false)
    expect(sameValues({ hide: ["a", "b"] }, { hide: ["a", "b"] })).toBe(true)
  })
})

describe("fromStored", () => {
  it("starts from the seeds when nothing is stored", () => {
    expect(fromStored(null, null, null)).toEqual(stateWith({}))
  })

  it("keeps a modern save as is", () => {
    const state = fromStored({ stats: { username: "x" } }, { theme: "dark" }, { pin: true })
    expect(state.values.stats).toEqual({ username: "x" })
    expect(state.common).toEqual({ theme: "dark" })
    expect(state.ownStyle).toEqual({ pin: true })
  })

  it("migrates per-card style: first card's becomes shared, differing cards keep their own", () => {
    const state = fromStored(
      {
        "stats": { username: "x", theme: "dark" },
        "top-langs": { username: "x", theme: "dark" },
        "pin": { username: "x", repo: "r", theme: "light" },
      },
      null,
      null,
    )
    expect(state.common).toEqual({ theme: "dark" })
    expect(state.values.stats).toEqual({ username: "x" })
    expect(state.values["top-langs"]).toEqual({ username: "x" })
    expect(state.values.pin).toEqual({ username: "x", repo: "r", theme: "light" })
    expect(state.ownStyle).toEqual({ pin: true })
  })
})

describe("applyUrlState", () => {
  const stored = stateWith({
    values: { ...seedValues(), stats: { username: "me", show_icons: true } },
    common: { theme: "dark" },
  })

  it("leaves the state alone without a link or with a bare card link", () => {
    expect(applyUrlState(stored, null)).toBe(stored)
    expect(applyUrlState(stored, { cardId: "stats", values: {} })).toBe(stored)
  })

  it("reproduces the link's card exactly", () => {
    const next = applyUrlState(stored, { cardId: "stats", values: { username: "octocat" } })
    expect(next.values.stats).toEqual({ username: "octocat" })
    expect(next.ownStyle.stats).toBe(false)
  })

  it("does not turn the shared style into the card's own on a plain reload", () => {
    const next = applyUrlState(stored, {
      cardId: "stats",
      values: { username: "me", show_icons: true, theme: "dark" },
    })
    expect(next.values.stats).toEqual({ username: "me", show_icons: true })
    expect(next.ownStyle.stats).toBe(false)
    expect(next.common).toEqual({ theme: "dark" })
  })

  it("gives the card its own style when the link's style differs from the shared one", () => {
    const next = applyUrlState(stored, {
      cardId: "stats",
      values: { username: "me", theme: "radical", title_color: "ff0000" },
    })
    expect(next.values.stats).toEqual({ username: "me", theme: "radical", title_color: "ff0000" })
    expect(next.ownStyle.stats).toBe(true)
    expect(next.common).toEqual({ theme: "dark" })
  })
})

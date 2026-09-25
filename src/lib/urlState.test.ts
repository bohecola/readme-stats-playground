import { describe, expect, it } from "vitest"

import { ENDPOINTS } from "./endpoints"
import { parseUrlState, toUrlSearch } from "./urlState"

const stats = ENDPOINTS.find((e) => e.id === "stats")!
const DEFAULT = ""

describe("parseUrlState", () => {
  it("returns null without a known card", () => {
    expect(parseUrlState("")).toBeNull()
    expect(parseUrlState("?card=nope&username=x")).toBeNull()
  })

  it("reads params in the card's own serialization", () => {
    const state = parseUrlState(
      "?card=stats&username=octocat&show_icons=true&hide=stars,commits&rank_icon=github&card_width=400&theme=dark",
    )
    expect(state).toEqual({
      cardId: "stats",
      values: {
        username: "octocat",
        show_icons: true,
        hide: ["stars", "commits"],
        rank_icon: "github",
        card_width: "400",
        theme: "dark",
      },
      baseUrl: undefined,
    })
  })

  it("drops values the param cannot take", () => {
    const state = parseUrlState(
      "?card=stats&username=x&show_icons=yes&rank_icon=fancy&card_width=wide&hide=stars,bogus&role=OWNER,nope",
    )
    expect(state?.values).toEqual({ username: "x", hide: ["stars"], role: ["OWNER"] })
  })

  it("normalizes the instance and keeps an explicit empty one", () => {
    expect(parseUrlState("?card=stats&instance=my.host")?.baseUrl).toBe("https://my.host")
    expect(parseUrlState("?card=stats&instance=")?.baseUrl).toBe("")
    expect(parseUrlState("?card=stats")?.baseUrl).toBeUndefined()
  })
})

describe("toUrlSearch", () => {
  it("keeps lists and the instance readable", () => {
    const search = toUrlSearch(
      stats,
      { username: "octocat", hide: ["stars", "commits"] },
      "https://my.host",
      DEFAULT,
    )
    expect(search).toBe("?card=stats&username=octocat&hide=stars,commits&instance=https://my.host")
  })

  it("omits the instance when it is the deployment default", () => {
    expect(toUrlSearch(stats, {}, "https://d", "https://d")).toBe("?card=stats")
  })

  it("round-trips through parseUrlState", () => {
    const values = {
      username: "octocat",
      custom_title: "Hi there",
      show_icons: true,
      hide: ["stars"],
      show: ["reviews", "prs_authored"],
      bg_color: "90,2f80ed,a855f7",
      commits_year: "2020",
    }
    const search = toUrlSearch(stats, values, "https://my.host", DEFAULT)
    expect(parseUrlState(search)).toEqual({ cardId: "stats", values, baseUrl: "https://my.host" })
  })
})

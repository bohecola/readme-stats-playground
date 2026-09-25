import { describe, expect, it } from "vitest"

import { buildUrl, normalizeBaseUrl, toHtml, toMarkdown } from "./buildUrl"
import { ENDPOINTS } from "./endpoints"

const stats = ENDPOINTS.find((e) => e.id === "stats")!
const pin = ENDPOINTS.find((e) => e.id === "pin")!
const BASE = "https://example.com"

describe("normalizeBaseUrl", () => {
  it("adds https:// when no scheme is given", () => {
    expect(normalizeBaseUrl("my-instance.vercel.app")).toBe("https://my-instance.vercel.app")
  })
  it("keeps an explicit scheme and drops trailing slashes and whitespace", () => {
    expect(normalizeBaseUrl("  http://localhost:3000///  ")).toBe("http://localhost:3000")
  })
  it("returns empty for blank input", () => {
    expect(normalizeBaseUrl("   ")).toBe("")
  })
})

describe("buildUrl", () => {
  it("omits defaults and empty values", () => {
    const { url, pairs } = buildUrl(BASE, stats, {
      username: "octocat",
      custom_title: "",
      show_icons: false,
      text_bold: true,
      rank_icon: "default",
      line_height: "25",
      hide: [],
      theme: "default",
    })
    expect(url).toBe(`${BASE}/api?username=octocat`)
    expect(pairs).toEqual([["username", "octocat"]])
  })

  it("serializes every type", () => {
    const { url } = buildUrl(BASE, stats, {
      username: "octocat",
      show_icons: true,
      text_bold: false,
      hide: ["stars", "commits"],
      rank_icon: "github",
      card_width: " 400 ",
      theme: "dark",
      title_color: "#FF0000",
    })
    expect(url).toBe(
      `${BASE}/api?username=octocat&hide=stars%2Ccommits&show_icons=true&text_bold=false&rank_icon=github&card_width=400&theme=dark&title_color=FF0000`,
    )
  })

  it("strips # from every gradient stop", () => {
    const { pairs } = buildUrl(BASE, stats, { username: "x", bg_color: "90, #2f80ed, #a855f7" })
    expect(pairs).toContainEqual(["bg_color", "90,2f80ed,a855f7"])
  })

  it("reports missing required params but still builds the URL", () => {
    const built = buildUrl(BASE, pin, { username: "octocat", repo: " " })
    expect(built.missingRequired).toEqual(["repo"])
    expect(built.url).toBe(`${BASE}/api/pin?username=octocat`)
  })

  it("tolerates a trailing slash on the base URL", () => {
    expect(buildUrl(`${BASE}/`, stats, {}).url).toBe(`${BASE}/api`)
  })
})

describe("snippets", () => {
  it("wraps the URL in Markdown and HTML", () => {
    expect(toMarkdown("https://x/api", "stats card")).toBe("![stats card](https://x/api)")
    expect(toHtml("https://x/api", "stats card")).toBe('<img src="https://x/api" alt="stats card" />')
  })
})

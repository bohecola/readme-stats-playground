import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import AutoImport from "unplugin-auto-import/vite"
import { defineConfig, loadEnv, type Plugin } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_")
  return {
    plugins: [
      react(),
      tailwindcss(),
      // React hooks (useState, useEffect, …) are available without importing.
      // src/auto-imports.d.ts is generated from this and is committed.
      AutoImport({
        imports: ["react"],
        dts: "src/auto-imports.d.ts",
      }),
      siteMeta(env.VITE_SITE_URL),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})

/**
 * Head tags that need the site's absolute URL — canonical, og:url, og:image and
 * JSON-LD — injected only when VITE_SITE_URL is set, so a build without it stays
 * valid. The static og:/twitter: tags live in index.html.
 */
function siteMeta(siteUrl: string | undefined): Plugin {
  const base = siteUrl?.trim().replace(/\/+$/, "")
  return {
    name: "site-meta",
    transformIndexHtml() {
      if (!base) return []
      const url = `${base}/`
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "README Stats Playground",
        url,
        description:
          "Visual playground for github-readme-stats and GitHub Stats Extended cards: tweak parameters, preview live, copy the Markdown for your GitHub profile README.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        image: `${base}/og.png`,
        sameAs: "https://github.com/bohecola/readme-stats-playground",
        isBasedOn: ["https://github.com/anuraghazra/github-readme-stats", "https://github.com/stats-organization/github-stats-extended"],
      }
      return [
        { tag: "link", attrs: { rel: "canonical", href: url }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:url", content: url }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image", content: `${base}/og.png` }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:image", content: `${base}/og.png` }, injectTo: "head" },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify(jsonLd),
          injectTo: "head",
        },
      ]
    },
  }
}

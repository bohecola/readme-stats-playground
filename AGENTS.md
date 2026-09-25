# AGENTS.md

Guidance for coding agents working in this repository. Humans: see [README.md](./README.md).

## What this is

A static single-page app (Vite + React) that builds card URLs for [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) and its API-compatible successor [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended) (the original is unmaintained; both must stay supported): pick a card, edit its parameters in a form, preview live, copy URL / Markdown / HTML. No backend, no database, no automated UI tests (only unit tests for `src/lib`). All source is under `src/`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm install` | Node 20.19+ (or 22.12+), pnpm 11 (pinned in `package.json`) |
| `pnpm dev` | dev server at http://localhost:5173 |
| `pnpm lint` | `tsc --noEmit` for `src/` and `vite.config.ts` — the only static check; must pass on every commit |
| `pnpm test` | Vitest unit tests for the pure helpers in `src/lib/*.test.ts` (URL building, URL state, colors) |
| `pnpm build` | type-check + production build into `dist/` (CI runs `lint`, `test` and `build`) |

## Conventions

- **Stack**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui, react-i18next.
- **Hooks are auto-imported** (`useState`, `useEffect`, `useMemo`, …) via `unplugin-auto-import`; don't add `import { useState } from "react"`. Type-only imports (`type ReactNode`) still come from `"react"`. `src/auto-imports.d.ts` is regenerated on dev/build — commit it when it changes.
- **`src/components/ui/` is stock shadcn/ui**, byte-identical to the registry. Never edit those files; customize at the call site (props, className) or in a wrapper component. `cn` comes from the `cn` package; `@/lib/utils` re-exports it.
- **Parameters are declared once** in `src/lib/endpoints.ts` (type, default, range, choices). Their text lives in `src/locales/{en,zh,ja}.json` under `params.<key>`; per-card wording goes under `cardParams.<card>.<key>`. Keep the key set identical across locale files.
- **URL building** (`src/lib/buildUrl.ts`) omits defaults and empty values; colors are written without `#`.
- **Both backends stay supported.** Params (or multiselect choices) that only GitHub Stats Extended understands carry `extended: true` / `extendedChoices` in `endpoints.ts` and show an "ext" mark in the UI; github-readme-stats simply ignores them. Audit against the successor's docs (`apps/frontend/src/content/docs/docs/cards/*.md` in its repo) and its `packages/core/src/api/*` handlers.
- **localStorage goes through `src/lib/storage.ts`** (`readStorage` / `writeStorage` / `readJson`), which never throws; keys are `rsp:*`. Don't call `localStorage` directly.
- **Common style** (theme, colors, border…) is shared across cards in App state (`common`); a card with `ownStyle[card] === true` keeps its own copy instead.
- **The page URL mirrors the card**: `?card=<id>&<param>=<value>…&instance=<url>` (`src/lib/urlState.ts`). A link wins over stored state on load and is then persisted.
- **Tailwind 4 specifics already handled in `src/index.css`**: buttons get `cursor: pointer` back (v4 preflight removed it); the react-colorful overrides must stay *unlayered* because the library injects unlayered styles at runtime; theme tokens are `hsl(var(--x))` values from the `:root` / `.dark` blocks.
- **Adding a language**: copy `src/locales/en.json`, translate, then register it in `src/i18n.ts` (`LANGUAGES`, `HTML_LANG`, `resources`) and in `LANGUAGE_NAMES` in `src/components/LanguageToggle.tsx`.
- **Adding or changing a parameter**: check the upstream README / `api/*.js` first; update `endpoints.ts` and all locale files together.

## Verifying a change

1. `pnpm lint` and `pnpm test` must be clean; add a case to the matching `*.test.ts` when changing a helper in `src/lib`.
2. Load the dev server and exercise the affected UI in the browser (dropdowns, popovers, the color picker and the number stepper are the usual suspects after dependency or styling changes).
3. `pnpm build` for anything touching CSS, Vite config or dependencies.

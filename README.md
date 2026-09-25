# README Stats Playground

[![CI](https://github.com/bohecola/readme-stats-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/bohecola/readme-stats-playground/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

A visual playground for [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) and [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended) cards: tweak parameters on the left, preview live on the right, and copy the URL / Markdown / HTML straight into your GitHub profile README.

**Try it: [readme-stats.deore.me](https://readme-stats.deore.me)**

![README Stats Playground screenshot](./docs/screenshot.png)

> This is a community tool, not affiliated with either project. Cards are rendered by whichever instance you point it at: the original github-readme-stats or its maintained, API-compatible successor [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended).

## Features

- All 5 github-readme-stats cards: Stats, Top Languages, Pin, WakaTime and Gist
- Every parameter as a form field, with its name, a hint and the raw URL key; the ones written to the URL are marked, and the ones only GitHub Stats Extended supports carry an "ext" tag
- Live preview and one-click copy as URL / Markdown / HTML
- Shareable links: the address bar always mirrors the current card (`?card=stats&username=octocat&theme=dark`), so a configuration can be handed over as a URL
- Common style shared across cards, with per-card overrides when you want them
- Works with github-readme-stats and GitHub Stats Extended instances, public or self-hosted; everything stays in your browser

## Getting started

Requires Node.js 20+ and pnpm 11 (`corepack enable` installs the version pinned in `package.json`).

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build into dist/
pnpm preview    # serve the production build locally
```

## Configuration

Defaults are set with build-time env vars. Copy `.env.example` to `.env.local` (git-ignored), or set them in your hosting provider:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_DEFAULT_BASE_URL` | Card instance (github-readme-stats or GitHub Stats Extended) used until a visitor picks their own | empty — visitors pick their instance |
| `VITE_DEFAULT_USERNAME` | GitHub username pre-filled on first visit | empty |
| `VITE_SITE_URL` | Public URL of the deployment; when set, the build emits the canonical link, Open Graph image and JSON-LD for search engines and AI crawlers | empty |

> Rendering needs a github-readme-stats-compatible instance. github-readme-stats itself is no longer maintained and its public instance is paused; its successor [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended) is API-compatible and runs a public instance (`github-stats-extended.vercel.app`), which the playground offers with one click. Self-hosted instances of either project work too — when hosting the playground for yourself, set `VITE_DEFAULT_BASE_URL` to yours so it's pre-filled.

## Deployment

It's a fully static site: run `pnpm build` and deploy `dist/` to any static host.

### Deploy your own

Self-hosting isn't required to use the playground, but it's worth it if you want:

- **your own card instance pre-filled** (`VITE_DEFAULT_BASE_URL`), so nobody has to pick one;
- your own domain;
- no dependency on someone else's deployment.

One click on Vercel — it asks for `VITE_DEFAULT_BASE_URL`; enter your instance, or leave it empty:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbohecola%2Freadme-stats-playground&project-name=readme-stats-playground&repository-name=readme-stats-playground&env=VITE_DEFAULT_BASE_URL&envDescription=Your%20github-readme-stats%20instance%20(pre-filled%20for%20visitors)%3B%20leave%20empty%20to%20let%20each%20visitor%20enter%20their%20own&envLink=https%3A%2F%2Fgithub.com%2Fbohecola%2Freadme-stats-playground%23configuration)

Or manually on Vercel / Netlify / Cloudflare Pages: import the repo, build command `pnpm build`, output directory `dist`, then add the variables from [Configuration](#configuration). After the first deploy, set `VITE_SITE_URL` to the site's URL and redeploy so the search-engine metadata is emitted.

**GitHub Pages**: when served from a sub-path (`https://<user>.github.io/<repo>/`), build with `pnpm build --base=/<repo>/`.

## Troubleshooting

Errors shown in the preview come from the card instance you're using; the playground just displays them:

| Message | Cause | Fix |
| --- | --- | --- |
| `This username is not whitelisted` | The instance sets `WHITELIST` and only allows listed usernames | Use an allowed username, or remove `WHITELIST` from the instance |
| `Bad credentials` | The instance's `PAT_1` (GitHub Personal Access Token) is expired or invalid | Update the token on the instance |
| `Maximum retries exceeded` / rate limited | The instance ran out of GitHub API quota | Retry later, or add more tokens (`PAT_2`, `PAT_3`…) to the instance |

## Project structure

```
src/
├── App.tsx                  # page layout and state
├── components/
│   ├── CardTabs.tsx         # card-type tabs
│   ├── CardForm.tsx         # parameter form per card
│   ├── ParamControl.tsx     # control per parameter type
│   ├── ColorPicker.tsx      # color picker incl. gradient editor
│   ├── Preview.tsx          # live preview + URL/Markdown/HTML output
│   ├── NumberInput.tsx      # numeric input with stepper buttons
│   ├── HintTip.tsx          # explanation bubble (info icon or dotted-underlined text)
│   ├── CopyButton.tsx       # copy button
│   ├── LanguageToggle.tsx   # language switch
│   ├── ThemeToggle.tsx      # light / dark toggle
│   └── ui/                  # shadcn/ui components (kept identical to the registry)
├── auto-imports.d.ts        # generated by unplugin-auto-import; React hooks need no import
├── i18n.ts                  # i18next setup and language detection
├── locales/                 # translations (en.json / zh.json / ja.json)
└── lib/
    ├── config.ts            # env-driven defaults
    ├── endpoints.ts         # parameter structure per card (type, default, range)
    ├── paramText.ts         # parameter text lookup (card override → shared)
    ├── buildUrl.ts          # builds the card URL, omitting defaults and empty values
    ├── urlState.ts          # page URL ⇄ card state (shareable links)
    ├── color.ts             # color conversions and gradient parsing
    └── themes.ts            # built-in theme names
```

## Tech stack

[Vite](https://vitejs.dev/) · [React 19](https://react.dev/) · TypeScript · [Tailwind CSS 4](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [react-i18next](https://react.i18next.com/) · [react-colorful](https://github.com/omgovich/react-colorful) · [lucide](https://lucide.dev/)

## Contributing

Issues and pull requests are welcome. Please make sure `pnpm lint` and `pnpm build` pass before submitting (CI checks both).

Conventions — auto-imported React hooks, stock shadcn/ui components in `src/components/ui/`, where parameters and their text live — are in [AGENTS.md](./AGENTS.md); they apply to people as much as to coding agents.

- **Adding or changing a parameter**: define its structure in `src/lib/endpoints.ts`, and add its name and hint under `params` in `src/locales/*.json` (use `cardParams.<card>` to override text for one card).
- **Adding a language**: copy `src/locales/en.json`, translate it, and register it in `src/i18n.ts`. Keep the keys identical across locale files.

## License

[MIT](./LICENSE)

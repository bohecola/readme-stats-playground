import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Github, Globe, RotateCcw } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"

import { CardForm } from "@/components/CardForm"
import { CardTabs } from "@/components/CardTabs"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Logo } from "@/components/Logo"
import { Preview } from "@/components/Preview"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DEFAULT_BASE_URL, DEFAULT_USERNAME, UPSTREAM_REPO_URL } from "@/lib/config"
import { ENDPOINTS } from "@/lib/endpoints"
import { useParamText } from "@/lib/paramText"
import { cn } from "@/lib/utils"
import {
  buildUrl,
  toHtml,
  toMarkdown,
  type ParamValue,
  type ParamValues,
} from "@/lib/buildUrl"

const LS_BASE = "rsp:baseUrl"
const LS_VALUES = "rsp:values"

/** Sensible starting values so the preview renders something immediately. */
function seedValues(): Record<string, ParamValues> {
  return {
    stats: { username: DEFAULT_USERNAME, show_icons: true },
    "top-langs": { username: DEFAULT_USERNAME, layout: "compact" },
    pin: { username: DEFAULT_USERNAME, repo: "" },
    wakatime: { username: "" },
    gist: { id: "bbfce31e0217a3689c8d961a356cb10d" },
  }
}

function loadValues(): Record<string, ParamValues> {
  try {
    const raw = localStorage.getItem(LS_VALUES)
    if (raw) return { ...seedValues(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return seedValues()
}

export default function App() {
  const { t } = useTranslation()
  const paramText = useParamText()
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem(LS_BASE) ?? DEFAULT_BASE_URL,
  )
  const [activeId, setActiveId] = useState(ENDPOINTS[0].id)
  const [allValues, setAllValues] =
    useState<Record<string, ParamValues>>(loadValues)

  const endpoint = ENDPOINTS.find((e) => e.id === activeId)!
  const values = allValues[activeId] ?? {}

  const persist = (next: Record<string, ParamValues>) => {
    setAllValues(next)
    try {
      localStorage.setItem(LS_VALUES, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const handleChange = (key: string, value: ParamValue) => {
    persist({ ...allValues, [activeId]: { ...values, [key]: value } })
  }

  const updateBase = (v: string) => {
    setBaseUrl(v)
    try {
      localStorage.setItem(LS_BASE, v)
    } catch {
      /* ignore */
    }
  }

  // The form column scrolls internally on lg; start each card at its top.
  const formScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    formScrollRef.current?.scrollTo({ top: 0 })
  }, [activeId])

  const resetActive = () => {
    persist({ ...allValues, [activeId]: seedValues()[activeId] ?? {} })
  }

  // Publish the (responsive) header height so sticky elements can sit below it.
  const headerRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return
    const publish = () =>
      document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  const built = useMemo(
    () => buildUrl(baseUrl, endpoint, values),
    [baseUrl, endpoint, values],
  )
  const alt = `${endpoint.id} card`

  const setKeys = useMemo(() => new Set(built.pairs.map(([key]) => key)), [built])
  // Nothing to reset when the URL already matches this card's starting values.
  const pristine = useMemo(
    () => buildUrl(baseUrl, endpoint, seedValues()[activeId] ?? {}).url === built.url,
    [baseUrl, endpoint, activeId, built],
  )

  return (
    <div className="flex min-h-screen flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header ref={headerRef} className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="container flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Logo className="h-[22px] w-[22px]" />
            </div>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              README Stats Playground
            </span>
          </div>

          {/* Full-width second row on narrow screens; inline before the icons from md up. */}
          <BaseUrlField
            value={baseUrl}
            onChange={updateBase}
            className="order-last w-full md:order-none md:ml-auto md:w-[380px]"
          />

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Separator orientation="vertical" className="mr-2 hidden h-5 md:block" />
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <a
                href={UPSTREAM_REPO_URL}
                target="_blank"
                rel="noreferrer"
                title="github-readme-stats"
                aria-label={t("app.upstreamRepo")}
              >
                <Github />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/*
        From lg up this is an app shell: the page is exactly one viewport tall
        and each column scrolls on its own. Below lg it's a normal scrolling page.
      */}
      <main className="container grid flex-1 grid-cols-1 content-start gap-6 py-6 sm:py-8 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:grid-rows-[minmax(0,1fr)] lg:content-stretch lg:py-6">
        <Card className="lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <CardTabs endpoints={ENDPOINTS} value={activeId} onValueChange={setActiveId} />
          <div
            ref={formScrollRef}
            className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:thin]"
          >
            <div className="flex flex-col gap-1 px-4 pb-2 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6">
              <p className="text-sm text-muted-foreground">
                {t(`cards.${endpoint.id}.description`)}
                <code className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                  {endpoint.path}
                </code>
              </p>
              <div className="-mr-2 flex shrink-0 items-center gap-1 self-end sm:-mt-1.5 sm:self-auto">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t("form.setCount", { count: setKeys.size })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetActive}
                  disabled={pristine}
                  title={t("form.resetTitle")}
                  className="gap-1.5 text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("form.reset")}
                </Button>
              </div>
            </div>
            <CardContent className="px-4 pt-4 sm:px-6">
              <CardForm
                endpoint={endpoint}
                values={values}
                onChange={handleChange}
                setKeys={setKeys}
              />
            </CardContent>
          </div>
        </Card>

        {/* Preview comes first on mobile so the result is visible up front. */}
        <Card className="order-first lg:order-none lg:max-h-full lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:thin]">
          <CardContent className="p-4 sm:p-6">
            <Preview
              url={built.url}
              markdown={toMarkdown(built.url, alt)}
              html={toHtml(built.url, alt)}
              missingRequired={built.missingRequired.map((key) => {
                const param = endpoint.params.find((p) => p.key === key)
                return (param && paramText(param, endpoint.id, "label")) ?? key
              })}
            />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-1 pb-24 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:py-3">
          <p>
            <Trans
              i18nKey="app.footerBuiltOn"
              components={{
                repo: (
                  // Text comes from the translation's <repo>…</repo> (not <link>: that is a void
                  // HTML element, so the parser would leave the link empty).
                  // eslint-disable-next-line jsx-a11y/anchor-has-content
                  <a
                    href={UPSTREAM_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                  />
                ),
              }}
            />
          </p>
          <p>{t("app.footerTagline")}</p>
        </div>
      </footer>
    </div>
  )
}

function BaseUrlField({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex h-9 items-center overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    >
      <label
        htmlFor="base-url"
        className="flex h-full shrink-0 items-center gap-1.5 border-r bg-muted/50 px-3 text-xs text-muted-foreground"
      >
        <Globe className="h-3.5 w-3.5" />
        {t("app.baseUrl")}
      </label>
      <input
        id="base-url"
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_BASE_URL}
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-xs outline-none placeholder:text-muted-foreground"
      />
      {value !== DEFAULT_BASE_URL && (
        <button
          type="button"
          title={t("app.resetBaseUrl")}
          aria-label={t("app.resetBaseUrl")}
          onClick={() => onChange(DEFAULT_BASE_URL)}
          className="mr-1 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

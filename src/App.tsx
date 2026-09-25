import type { ParamValue } from "@/lib/buildUrl"
import type { StoredState } from "@/lib/cardState"
import type { CardId } from "@/lib/endpoints"

import { Github, RotateCcw } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { BaseUrlField } from "@/components/BaseUrlField"
import { CardForm } from "@/components/CardForm"
import { CardTabs } from "@/components/CardTabs"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Logo } from "@/components/Logo"
import { Preview } from "@/components/Preview"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { buildUrl, toHtml, toMarkdown } from "@/lib/buildUrl"
import { isCommonKey, loadState, seedValues, splitCommon, storeState } from "@/lib/cardState"
import {
  DEFAULT_BASE_URL,
  EXTENDED_REPO_URL,
  REPO_URL,
  SUGGESTED_INSTANCE_URL,
  UPSTREAM_REPO_URL,
} from "@/lib/config"
import { ENDPOINTS } from "@/lib/endpoints"
import { useParamText } from "@/lib/paramText"
import { readStorage, writeStorage } from "@/lib/storage"
import { parseUrlState, toUrlSearch } from "@/lib/urlState"

const LS_BASE = "rsp:baseUrl"

/** A shared link (?card=…&param=…) takes precedence over what's stored. */
const URL_STATE = parseUrlState(window.location.search)

const footerLink
  = "font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"

export default function App() {
  const { t } = useTranslation()
  const paramText = useParamText()
  const [baseUrl, setBaseUrl] = useState(
    () => URL_STATE?.baseUrl ?? readStorage(LS_BASE) ?? DEFAULT_BASE_URL,
  )
  const [activeId, setActiveId] = useState<CardId>(URL_STATE?.cardId ?? ENDPOINTS[0].id)
  // Lifted so the preview's "set up an instance" prompt can open the editor.
  const [editingInstance, setEditingInstance] = useState(false)
  const [state, setState] = useState<StoredState>(() => loadState(URL_STATE))
  const { values: allValues, common, ownStyle } = state

  const endpoint = ENDPOINTS.find(e => e.id === activeId)!
  const cardValues = useMemo(() => allValues[activeId] ?? {}, [allValues, activeId])
  const ownStyleActive = ownStyle[activeId] === true
  // What the card renders with: its own params plus the shared style, unless it opted out.
  const values = useMemo(
    () => (ownStyleActive ? cardValues : { ...splitCommon(cardValues).own, ...common }),
    [ownStyleActive, cardValues, common],
  )

  // Updates go through the previous state so rapid edits (a held stepper
  // button fires from one closure) never overwrite each other.
  const persist = (update: (prev: StoredState) => StoredState) => {
    setState((prev) => {
      const next = update(prev)
      storeState(next) // idempotent, so StrictMode's double call is harmless
      return next
    })
  }

  const handleChange = (key: string, value: ParamValue) => {
    persist(prev =>
      isCommonKey(key) && prev.ownStyle[activeId] !== true
        ? { ...prev, common: { ...prev.common, [key]: value } }
        : {
            ...prev,
            values: { ...prev.values, [activeId]: { ...prev.values[activeId], [key]: value } },
          },
    )
  }

  // Opting out starts from the shared look; opting back in drops the card's own copy.
  const setOwnStyle = (own: boolean) => {
    persist((prev) => {
      const card = prev.values[activeId] ?? {}
      return {
        ...prev,
        values: { ...prev.values, [activeId]: own ? { ...card, ...prev.common } : splitCommon(card).own },
        ownStyle: { ...prev.ownStyle, [activeId]: own },
      }
    })
  }

  // Back to the card's starting params and the shared style; the shared style itself is kept.
  const resetActive = () => {
    persist(prev => ({
      ...prev,
      values: { ...prev.values, [activeId]: seedValues()[activeId] ?? {} },
      ownStyle: { ...prev.ownStyle, [activeId]: false },
    }))
  }

  const updateBase = (v: string) => {
    setBaseUrl(v)
    writeStorage(LS_BASE, v)
  }

  // The form column scrolls internally on lg; start each card at its top.
  const formScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    formScrollRef.current?.scrollTo({ top: 0 })
  }, [activeId])

  // Publish the (responsive) header height so sticky elements can sit below it.
  const headerRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header)
      return
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
  // Keep the address bar shareable: it always describes the current card.
  useEffect(() => {
    const search = toUrlSearch(endpoint, values, baseUrl, DEFAULT_BASE_URL)
    if (window.location.search !== search) {
      window.history.replaceState(null, "", search + window.location.hash)
    }
  }, [endpoint, values, baseUrl])

  const alt = `${endpoint.id} card`

  const setKeys = useMemo(() => new Set(built.pairs.map(([key]) => key)), [built])
  // Nothing to reset when the URL already matches this card's starting values.
  const pristine = useMemo(
    () =>
      !ownStyleActive
      && buildUrl(baseUrl, endpoint, { ...seedValues()[activeId], ...common }).url === built.url,
    [baseUrl, endpoint, activeId, built, common, ownStyleActive],
  )

  return (
    <div className="flex min-h-screen flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header ref={headerRef} className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/90">
        <div className="container flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Logo className="h-[22px] w-[22px]" />
            </div>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              README Stats Playground
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                title={t("app.projectRepo")}
                aria-label={t("app.projectRepo")}
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
        <Card className="gap-0 py-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <CardTabs endpoints={ENDPOINTS} value={activeId} onValueChange={setActiveId} />
          <div
            ref={formScrollRef}
            className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-thin"
          >
            <div className="flex flex-col gap-1 px-4 pb-2 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
              <p className="text-xs leading-6 text-muted-foreground">
                <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                  {endpoint.path}
                </code>
                {t(`cards.${endpoint.id}.description`)}
              </p>
              <div className="-mr-2 flex shrink-0 items-center gap-1 self-end sm:self-auto">
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
            <CardContent className="px-4 pt-4 pb-6 sm:px-6">
              <CardForm
                endpoint={endpoint}
                values={values}
                onChange={handleChange}
                setKeys={setKeys}
                ownStyle={ownStyleActive}
                onOwnStyleChange={setOwnStyle}
              />
            </CardContent>
          </div>
        </Card>

        {/* Preview comes first on mobile so the result is visible up front. */}
        <Card className="gap-0 py-0 order-first lg:order-0 lg:max-h-full lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-thin">
          <CardContent className="p-4 sm:p-6">
            <Preview
              url={built.url}
              markdown={toMarkdown(built.url, alt)}
              html={toHtml(built.url, alt)}
              missingRequired={built.missingRequired.map((key) => {
                const param = endpoint.params.find(p => p.key === key)
                return (param && paramText(param, endpoint.id, "label")) ?? key
              })}
              instanceMissing={baseUrl.trim() === ""}
              onSetupInstance={() => setEditingInstance(true)}
              onUseSuggestedInstance={() => updateBase(SUGGESTED_INSTANCE_URL)}
            />
          </CardContent>
          {/* Set-once setting that shapes both the preview and the copied code above. */}
          <BaseUrlField
            value={baseUrl}
            onChange={updateBase}
            editing={editingInstance}
            onEditingChange={setEditingInstance}
            className="rounded-b-xl border-t bg-muted/30 px-4 py-2 sm:px-6"
          />
        </Card>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-1 pb-24 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:py-3">
          <p>
            <Trans
              i18nKey="app.footerBuiltOn"
              components={{
                // Text comes from the translation's <repo>…</repo> / <extended>…</extended>
                // (not <link>: that is a void HTML element, so the parser would leave it empty).
                repo: <a href={UPSTREAM_REPO_URL} target="_blank" rel="noreferrer" className={footerLink} />,
                extended: <a href={EXTENDED_REPO_URL} target="_blank" rel="noreferrer" className={footerLink} />,
              }}
            />
          </p>
          <p>{t("app.footerTagline")}</p>
        </div>
      </footer>
    </div>
  )
}

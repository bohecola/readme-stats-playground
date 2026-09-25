import { type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ExternalLink,
  Grid2x2,
  ImageOff,
  LoaderCircle,
  Moon,
  RefreshCw,
  Sun,
  TriangleAlert,
} from "lucide-react"

import { CopyButton } from "@/components/CopyButton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Backdrop = "dark" | "light" | "checker"
type Format = "markdown" | "html" | "url"

const BACKDROP_CLASS: Record<Backdrop, string> = {
  dark: "bg-zinc-900",
  light: "bg-white",
  checker:
    "bg-white bg-[conic-gradient(#e5e5e5_90deg,transparent_90deg_180deg,#e5e5e5_180deg_270deg,transparent_270deg)] bg-size-[20px_20px]",
}

const FORMAT_LABEL: Record<Format, string> = { markdown: "Markdown", html: "HTML", url: "URL" }

const LS_BACKDROP = "rsp:previewBackdrop"
const LS_FORMAT = "rsp:outputFormat"

/** Wait for edits to settle before hitting the instance (typing = many URLs). */
const PREVIEW_DEBOUNCE_MS = 400

function loadChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return allowed.includes(v as T) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

function saveChoice(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Remembering UI choices is optional.
  }
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

interface PreviewProps {
  url: string
  markdown: string
  html: string
  missingRequired: string[]
}

export function Preview({ url, markdown, html, missingRequired }: PreviewProps) {
  const { t } = useTranslation()
  const [backdrop, setBackdrop] = useState<Backdrop>(() =>
    loadChoice(LS_BACKDROP, ["dark", "light", "checker"], "dark"),
  )
  const [format, setFormat] = useState<Format>(() =>
    loadChoice(LS_FORMAT, ["markdown", "html", "url"], "markdown"),
  )
  const [nonce, setNonce] = useState(0)

  const ready = missingRequired.length === 0
  // Cache-buster only affects the preview request, not the URL we display/copy.
  const requested = ready ? `${url}${url.includes("?") ? "&" : "?"}_r=${nonce}` : ""
  const src = useDebounced(requested, PREVIEW_DEBOUNCE_MS)
  const card = useCardImage(src)

  const output = { markdown, html, url }[format]

  // Mobile only: when the preview scrolls out of view, a bottom bar keeps a
  // live thumbnail and the copy button within reach.
  const frameRef = useRef<HTMLDivElement>(null)
  const [frameVisible, setFrameVisible] = useState(true)
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const io = new IntersectionObserver(([entry]) => setFrameVisible(entry.isIntersecting))
    io.observe(frame)
    return () => io.disconnect()
  }, [])

  // gap, not space-y: the fixed mobile bar below is a child and must not add spacing.
  return (
    <div className="flex flex-col gap-4">
      {/* The card is self-explanatory; keep the heading for screen readers only. */}
      <h2 className="sr-only">{t("preview.title")}</h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Segmented
            value={backdrop}
            onChange={(b) => {
              setBackdrop(b)
              saveChoice(LS_BACKDROP, b)
            }}
            options={[
              { value: "dark", label: t("preview.bgDark"), icon: <Moon className="h-3.5 w-3.5" /> },
              { value: "light", label: t("preview.bgLight"), icon: <Sun className="h-3.5 w-3.5" /> },
              { value: "checker", label: t("preview.bgTransparent"), icon: <Grid2x2 className="h-3.5 w-3.5" /> },
            ]}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title={t("preview.refresh")}
            aria-label={t("preview.refreshLabel")}
            disabled={!ready}
            onClick={() => setNonce((n) => n + 1)}
          >
            <RefreshCw className={cn(card.loading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title={t("preview.openInNewTab")}
            aria-label={t("preview.openInNewTab")}
            disabled={!ready}
            asChild={ready}
          >
            {ready ? (
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink />
              </a>
            ) : (
              <ExternalLink />
            )}
          </Button>
        </div>
      </div>

      <div
        ref={frameRef}
        className={cn(
          "relative flex min-h-[180px] items-center justify-center overflow-auto rounded-lg border p-4",
          BACKDROP_CLASS[backdrop],
        )}
      >
        {!ready ? (
          <PreviewMessage backdrop={backdrop} icon={<TriangleAlert className="h-5 w-5" />}>
            {t("preview.missingRequired", {
              fields: missingRequired.join(t("preview.listSeparator")),
            })}
          </PreviewMessage>
        ) : card.error && !card.shown ? (
          <PreviewMessage backdrop={backdrop} icon={<ImageOff className="h-5 w-5" />}>
            {t("preview.loadFailed")}
          </PreviewMessage>
        ) : card.shown ? (
          <img
            src={card.shown}
            alt={t("preview.alt")}
            className={cn(
              "max-w-full transition-opacity duration-200",
              (card.loading || card.error) && "opacity-50",
            )}
          />
        ) : (
          <LoaderCircle
            className={cn(
              "h-5 w-5 animate-spin",
              backdrop === "dark" ? "text-zinc-500" : "text-zinc-400",
            )}
          />
        )}

        {ready && card.shown && card.error && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground shadow-sm">
            {t("preview.staleError")}
          </span>
        )}
      </div>

      {/* One code block: format tabs and copy live in its header bar. */}
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 p-1">
          <Segmented
            value={format}
            onChange={(f) => {
              setFormat(f)
              saveChoice(LS_FORMAT, f)
            }}
            options={[
              { value: "markdown", label: "Markdown" },
              { value: "html", label: "HTML" },
              { value: "url", label: "URL" },
            ]}
          />
          <CopyButton
            text={output}
            disabled={!ready}
            variant="ghost"
            className="h-7 min-w-[68px] px-2.5 text-xs text-muted-foreground hover:text-foreground"
          />
        </div>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground/90">
          {output}
        </pre>
      </div>

      {/* `invisible` rides the transition, so it hides only after sliding out. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_12px_-8px_rgb(0_0_0/0.15)] backdrop-blur-sm transition-[transform,visibility] duration-200 supports-backdrop-filter:bg-background/90 lg:hidden",
          frameVisible && "invisible translate-y-full",
        )}
      >
        <div className="container flex items-center gap-3 py-2.5">
          <button
            type="button"
            onClick={() => frameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className={cn(
                "flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border p-1",
                BACKDROP_CLASS[backdrop],
              )}
            >
              {ready && card.shown ? (
                <img
                  src={card.shown}
                  alt=""
                  className={cn("max-h-full max-w-full", card.loading && "opacity-50")}
                />
              ) : (
                <TriangleAlert className="h-4 w-4 text-zinc-400" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{t("preview.live")}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {ready ? t("preview.tapToView") : t("preview.missingRequiredShort")}
              </span>
            </span>
          </button>
          <CopyButton text={output} disabled={!ready} label={t("preview.copyFormat", { format: FORMAT_LABEL[format] })} />
        </div>
      </div>
    </div>
  )
}

/**
 * Preloads each new card URL off-screen and only swaps it in once it has
 * loaded, so the previous card stays visible (dimmed) instead of flashing.
 */
function useCardImage(src: string) {
  const [shown, setShown] = useState("")
  const [state, setState] = useState<{ src: string; status: "loading" | "ok" | "error" }>({
    src: "",
    status: "ok",
  })

  useEffect(() => {
    if (!src) return
    let cancelled = false
    setState({ src, status: "loading" })
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      setShown(src)
      setState({ src, status: "ok" })
    }
    img.onerror = () => {
      if (!cancelled) setState({ src, status: "error" })
    }
    img.src = src
    return () => {
      cancelled = true
      img.onload = img.onerror = null
    }
  }, [src])

  const current = state.src === src
  return {
    shown,
    loading: !current || state.status === "loading",
    error: current && state.status === "error",
  }
}

function PreviewMessage({
  backdrop,
  icon,
  children,
}: {
  backdrop: Backdrop
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 text-center text-sm",
        backdrop === "dark" ? "text-zinc-400" : "text-zinc-500",
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-md bg-muted p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.icon ? o.label : undefined}
            title={o.icon ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-7 items-center justify-center rounded px-2.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon ?? o.label}
          </button>
        )
      })}
    </div>
  )
}

import { Check, Pencil, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HintTip } from "@/components/HintTip"
import { normalizeBaseUrl } from "@/lib/buildUrl"
import { DEFAULT_BASE_URL } from "@/lib/config"
import { cn } from "@/lib/utils"

/** "https://example.com/" -> "example.com": the full URL lives in the editor and tooltip. */
const displayHost = (url: string) => url.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")

const iconButton
  = "shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"

/**
 * Shows the instance as text that is itself the Edit button, with a pencil so
 * it's clearly editable (a hover-only input is easy to miss, and invisible on
 * touch). Editing swaps in a real input; reset lives there too.
 */
export function BaseUrlField({
  value,
  onChange,
  editing,
  onEditingChange: setEditing,
  className,
}: {
  value: string
  onChange: (v: string) => void
  /** Controlled so the preview's "set up an instance" prompt can open the editor. */
  editing: boolean
  onEditingChange: (editing: boolean) => void
  className?: string
}) {
  const { t } = useTranslation()
  const editRef = useRef<HTMLButtonElement>(null)

  const finish = (next?: string) => {
    // Adds https:// when omitted; empty falls back to the deployment default (which may itself be empty).
    if (next !== undefined)
      onChange(normalizeBaseUrl(next) || DEFAULT_BASE_URL)
    setEditing(false)
  }
  // Keyboard users land back on the Edit button after closing the editor.
  const finishAndRefocus = (next?: string) => {
    finish(next)
    requestAnimationFrame(() => editRef.current?.focus())
  }

  return (
    <div className={cn("flex min-h-11 items-center gap-2 text-xs", className)}>
      <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <HintTip text={t("app.baseUrlHint")}>{t("app.baseUrl")}</HintTip>
      </div>

      {editing
        ? (
            // Mounted only while editing, so its draft always starts from the current value.
            <BaseUrlEditor value={value} onFinish={finish} onFinishAndRefocus={finishAndRefocus} />
          )
        : (
            <button
              ref={editRef}
              type="button"
              onClick={() => setEditing(true)}
              title={t("app.editBaseUrl")}
              aria-label={`${t("app.editBaseUrl")}: ${value}`}
              className="group -mr-1.5 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              {value
                ? (
                    <span className="min-w-0 flex-1 truncate font-mono text-foreground/90">
                      {displayHost(value)}
                    </span>
                  )
                : (
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{t("app.noInstance")}</span>
                  )}
              <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </button>
          )}
    </div>
  )
}

/** The instance input with its save / reset buttons; `onFinish(undefined)` cancels. */
function BaseUrlEditor({
  value,
  onFinish,
  onFinishAndRefocus,
}: {
  value: string
  onFinish: (next?: string) => void
  onFinishAndRefocus: (next?: string) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  // Buttons beside the input keep focus in it, so its blur doesn't race their click.
  const keepInputFocus = (e: React.MouseEvent) => e.preventDefault()

  return (
    <>
      <input
        id="base-url"
        aria-label={t("app.baseUrl")}
        autoFocus
        value={draft}
        spellCheck={false}
        onFocus={e => e.target.select()}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => onFinish(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            onFinishAndRefocus(draft)
          if (e.key === "Escape")
            onFinishAndRefocus()
        }}
        placeholder={DEFAULT_BASE_URL || t("app.instancePlaceholder")}
        className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs shadow-xs outline-hidden placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />
      {DEFAULT_BASE_URL !== "" && value !== DEFAULT_BASE_URL && (
        <button
          type="button"
          title={t("app.resetBaseUrl")}
          aria-label={t("app.resetBaseUrl")}
          onMouseDown={keepInputFocus}
          onClick={() => onFinish(DEFAULT_BASE_URL)}
          className={iconButton}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        title={t("app.saveBaseUrl")}
        aria-label={t("app.saveBaseUrl")}
        onMouseDown={keepInputFocus}
        onClick={() => onFinish(draft)}
        className={cn(iconButton, "-mr-1.5")}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </>
  )
}

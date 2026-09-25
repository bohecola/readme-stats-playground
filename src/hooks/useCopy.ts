/** Clipboard write with a fallback; `copied` flips back after a moment. */
export function useCopy() {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch {
      // Fallback for insecure contexts / older browsers.
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(setCopied, 1500, false)
  }

  return { copied, copy }
}

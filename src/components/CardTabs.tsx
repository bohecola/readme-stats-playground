import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CardId, EndpointDef } from "@/lib/endpoints"
import { cn } from "@/lib/utils"

/** Current sticky header height, published by App as `--header-h`. */
function headerHeight() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0
}

/**
 * Card-type tabs rendered as the form card's header strip. Below lg the page
 * scrolls, so the strip sticks under the page header (scoped to the card) and
 * gains a shadow once stuck; from lg up the card body scrolls instead and the
 * strip is a plain static row.
 */
export function CardTabs({
  endpoints,
  value,
  onValueChange,
}: {
  endpoints: EndpointDef[]
  value: CardId
  onValueChange: (id: CardId) => void
}) {
  // Zero-height marker at the strip's natural position: once it passes under
  // the header, the strip is stuck.
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  // On narrow screens the tab row scrolls sideways; fade its right edge while
  // there are more tabs past it so that's discoverable.
  const listRef = useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = useState(false)
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () =>
      setMoreRight(list.scrollWidth - list.clientWidth - list.scrollLeft > 1)
    update()
    list.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(list)
    return () => {
      list.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [])

  // A tab tapped while half off-screen slides fully into view.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [value])

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = sentinelRef.current?.getBoundingClientRect().top ?? Infinity
        setStuck(top < headerHeight())
      })
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  // Switching cards mid-page would otherwise leave you halfway down the new
  // form; bring the card's top back to just under the header.
  // Radix hands back a plain string; it's always one of the ids we rendered.
  const change = (id: string) => {
    onValueChange(id as CardId)
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const target = sentinel.getBoundingClientRect().top + window.scrollY - headerHeight()
    if (window.scrollY > target) window.scrollTo({ top: target, behavior: "smooth" })
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden />
      <div
        className={cn(
          "sticky top-[var(--header-h,0px)] z-20 shrink-0 border-b bg-card/95 px-4 backdrop-blur sm:px-6 lg:static transition-[border-radius,box-shadow] duration-200 supports-[backdrop-filter]:bg-card/90",
          stuck ? "rounded-none shadow-[0_6px_12px_-8px_rgb(0_0_0/0.15)]" : "rounded-t-xl",
        )}
      >
        <Tabs value={value} onValueChange={change} className="relative">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card to-transparent transition-opacity duration-200",
              moreRight ? "opacity-100" : "opacity-0",
            )}
          />
          <TabsList
            ref={listRef}
            className="-mb-px flex h-auto w-full justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {endpoints.map((e) => (
              <TabsTrigger
                key={e.id}
                value={e.id}
                // scroll-mr matches the fade's width so a scrolled-to tab clears it.
                className="scroll-mr-12 rounded-none border-b-2 border-transparent px-0.5 pb-3 pt-4 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {t(`cards.${e.id}.name`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  )
}

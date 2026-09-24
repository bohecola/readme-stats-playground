import { cn } from "@/lib/utils"

/**
 * Brand mark: a miniature stats card — three stat rows beside a rank ring,
 * the same anatomy as the cards this playground builds.
 * Keep in sync with public/favicon.svg.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="M6.5 9.5h5M6.5 12h3.5M6.5 14.5h4.5" />
      <circle cx="16.5" cy="12" r="2.5" />
    </svg>
  )
}

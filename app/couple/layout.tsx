import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default async function CoupleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const user = session.user as any
  const userName: string = user.name ?? user.email ?? "?"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <SidebarProvider>
      <AppSidebar
        userName={userName}
        weddingName={user.tenantName ?? "Your Wedding"}
      />

      <SidebarInset>
        {/* ── Top header bar ── */}
        <header
          className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-4 gap-3"
          style={{
            background: "#FFFDF9",
            borderBottom: "1px solid #E8DDD5",
          }}
        >
          {/* Left: sidebar trigger + mobile wordmark */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />

            {/* Mobile-only wordmark (sidebar is hidden on mobile) */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <span className="text-base leading-none" aria-hidden>🐝</span>
              <span
                className="font-bold text-base flex items-center"
                style={{ fontFamily: "var(--font-display)", color: "#8DB870" }}
              >
                HoneyD
                <svg viewBox="0 0 24 24" aria-hidden style={{ display: "inline-block", width: "0.85em", height: "0.85em", verticalAlign: "-0.1em" }} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="7 12.5 10.5 16 17 9" />
                </svg>
              </span>
            </div>
          </div>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full transition-colors"
              style={{ color: "#7A6E66" }}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-xs font-bold"
                style={{ background: "#F5C27A", color: "#1A1A0F" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

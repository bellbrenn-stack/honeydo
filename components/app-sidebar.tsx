"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Clock,
  Users,
  StickyNote,
  Image,
  LogOut,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// ─── Brand wordmark (inline, no image file needed) ───────────────────────────

function SidebarWordmark() {
  return (
    <span
      className="font-bold text-lg leading-none flex items-center"
      style={{ fontFamily: "var(--font-display)", color: "#8DB870" }}
    >
      HoneyD
      <svg viewBox="0 0 24 24" aria-hidden style={{ display: "inline-block", width: "0.85em", height: "0.85em", verticalAlign: "-0.1em" }} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="7 12.5 10.5 16 17 9" />
      </svg>
    </span>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/couple",           label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/couple/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/couple/budget",    label: "Budget",    icon: DollarSign },
  { href: "/couple/timeline",  label: "Timeline",  icon: Clock },
  { href: "/couple/vendors",   label: "Vendors",   icon: Users },
  { href: "/couple/notes",     label: "Notes",     icon: StickyNote },
  { href: "/couple/moodboard", label: "Moodboard", icon: Image },
]

// ─── AppSidebar ───────────────────────────────────────────────────────────────

interface AppSidebarProps {
  userName: string
  weddingName: string
}

export function AppSidebar({ userName, weddingName }: AppSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Sidebar>
      {/* ── Header ── */}
      <SidebarHeader className="px-4 py-4" style={{ borderBottom: "1px solid color-mix(in srgb, #FFFFFF 8%, transparent)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none" aria-hidden>🐝</span>
          <SidebarWordmark />
        </div>
        {weddingName && (
          <p
            className="text-xs mt-1.5 truncate"
            style={{ color: "rgba(250,243,238,0.45)" }}
          >
            {weddingName}
          </p>
        )}
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-xs uppercase tracking-wider"
            style={{ color: "rgba(250,243,238,0.35)" }}
          >
            Planning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isActive(href, exact)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="p-3" style={{ borderTop: "1px solid color-mix(in srgb, #FFFFFF 8%, transparent)" }}>
        <div className="flex items-center gap-3">
          {/* Gold avatar */}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: "#F5C27A", color: "#1A1A0F" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <span
            className="flex-1 truncate text-sm font-medium"
            style={{ color: "#FAF3EE" }}
          >
            {userName}
          </span>

          <div className="flex items-center gap-1">
            <Link
              href="/couple/settings"
              className="p-1 rounded transition-colors"
              style={{ color: "rgba(250,243,238,0.45)" }}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1 rounded transition-colors"
              style={{ color: "rgba(250,243,238,0.45)" }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

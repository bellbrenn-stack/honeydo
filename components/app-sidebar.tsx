"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Heart,
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

const NAV_ITEMS = [
  { href: "/couple", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/couple/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/couple/budget", label: "Budget", icon: DollarSign },
  { href: "/couple/timeline", label: "Timeline", icon: Clock },
  { href: "/couple/vendors", label: "Vendors", icon: Users },
  { href: "/couple/notes", label: "Notes", icon: StickyNote },
  { href: "/couple/moodboard", label: "Moodboard", icon: Image },
]

interface AppSidebarProps {
  userName: string
  weddingName: string
}

export function AppSidebar({ userName, weddingName }: AppSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="h-5 w-5 fill-primary" />
          <span className="font-semibold tracking-tight">HoneyDo</span>
        </div>
        {weddingName && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{weddingName}</p>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Planning</SidebarGroupLabel>
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

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm font-medium">{userName}</span>
          <div className="flex items-center gap-1">
            <Link
              href="/couple/settings"
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
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

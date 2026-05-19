"use client"

import Link from "next/link"
import { useMemo } from "react"
import { differenceInDays, format } from "date-fns"
import {
  CheckCircle2,
  DollarSign,
  Clock,
  Users,
  FileText,
  ImageIcon,
  ArrowRight,
  Heart,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Wedding, ChecklistItem, BudgetItem, Vendor } from "@/lib/generated/prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  wedding: Wedding
  checklistItems: ChecklistItem[]
  budgetItems: BudgetItem[]
  vendors: Vendor[]
  timelineCount: number
}

// ─── Feature tile ─────────────────────────────────────────────────────────────

interface TileProps {
  href: string
  bg: string
  iconBg: string
  icon: React.ReactNode
  stat: string
  statLabel: string
  sub: string
  textColor: string
  subColor: string
  comingSoon?: boolean
  progress?: number
  progressBg?: string
}

function FeatureTile({
  href,
  bg,
  iconBg,
  icon,
  stat,
  statLabel,
  sub,
  textColor,
  subColor,
  comingSoon,
  progress,
  progressBg,
}: TileProps) {
  const inner = (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl p-6 h-56 overflow-hidden transition-all duration-200",
        bg,
        comingSoon ? "opacity-70 cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-xl"
      )}
    >
      {/* Top row: icon + arrow */}
      <div className="flex items-start justify-between">
        <div className={cn("flex items-center justify-center rounded-2xl w-12 h-12", iconBg)}>
          {icon}
        </div>
        {!comingSoon && (
          <ArrowRight
            className={cn(
              "h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 opacity-60",
              textColor
            )}
          />
        )}
        {comingSoon && (
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full bg-white/30", textColor)}>
            Coming soon
          </span>
        )}
      </div>

      {/* Bottom: stat + labels */}
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-2">
          <span
            className={cn("text-4xl font-bold leading-none", textColor)}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {stat}
          </span>
          <span className={cn("text-sm font-medium mb-0.5", textColor, "opacity-80")}>{statLabel}</span>
        </div>
        {progress !== undefined && (
          <Progress
            value={progress}
            className={cn("h-1.5 mt-1", progressBg)}
          />
        )}
        <p className={cn("text-xs mt-0.5", subColor)}>{sub}</p>
      </div>
    </div>
  )

  if (comingSoon) return inner
  return <Link href={href} className="block">{inner}</Link>
}

// ─── DashboardHome ────────────────────────────────────────────────────────────

export function DashboardHome({
  wedding,
  checklistItems,
  budgetItems,
  vendors,
  timelineCount,
}: Props) {
  const daysUntil = useMemo(() => {
    if (!wedding.weddingDate) return null
    return Math.max(0, differenceInDays(new Date(wedding.weddingDate), new Date()))
  }, [wedding.weddingDate])

  const checklist = useMemo(() => {
    const total = checklistItems.length
    const done = checklistItems.filter((i) => i.status === "COMPLETED").length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [checklistItems])

  const budget = useMemo(() => {
    const total = wedding.budget ?? 0
    const spent = budgetItems.reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0)
    return { total, spent, remaining: total - spent }
  }, [budgetItems, wedding.budget])

  const bookedVendors = vendors.filter((v) => v.booked).length

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`

  return (
    <div className="flex flex-col gap-8">

      {/* ── Hero countdown ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-cream border border-[#E8DDD5] px-8 py-8" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Decorative circles */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-coral/15 pointer-events-none" />
        <div className="absolute -right-4 -bottom-10 h-32 w-32 rounded-full bg-brand-green/15 pointer-events-none" />
        <div className="absolute right-36 -bottom-8 h-20 w-20 rounded-full bg-brand-peach/20 pointer-events-none" />

        <div className="relative flex flex-col gap-1">
          {/* Eyebrow */}
          <div className="flex items-center gap-2" style={{ color: "#B85A3A" }}>
            <Heart className="h-4 w-4" style={{ fill: "#E8674A", color: "#E8674A" }} />
            <span className="text-sm font-medium tracking-wide uppercase">{wedding.name}</span>
          </div>

          {/* Countdown number */}
          {daysUntil !== null ? (
            <div className="flex items-end gap-3 mt-1">
              <span
                className="text-8xl font-bold leading-none"
                style={{ fontFamily: "var(--font-display)", color: "#1A1A0F" }}
              >
                {daysUntil}
              </span>
              <div className="flex flex-col pb-2" style={{ color: "#B85A3A" }}>
                <span className="text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {daysUntil === 0 ? "Today's" : "days"}
                </span>
                <span className="text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {daysUntil === 0 ? "the day!" : "to go"}
                </span>
              </div>
            </div>
          ) : (
            <p
              className="text-3xl font-semibold mt-1"
              style={{ fontFamily: "var(--font-display)", color: "#B85A3A" }}
            >
              Set your wedding date
            </p>
          )}

          {/* Date line */}
          <p className="text-sm mt-1" style={{ color: "#7A6E66" }}>
            {wedding.weddingDate
              ? format(new Date(wedding.weddingDate), "EEEE, MMMM d, yyyy")
              : "No date set yet · add one in Settings"}
            {wedding.venue ? ` · ${wedding.venue}` : ""}
          </p>

          {/* Tagline */}
          <p
            className="text-base italic mt-2"
            style={{ fontFamily: "var(--font-display)", color: "#B85A3A", opacity: 0.65 }}
          >
            make planning sweet
          </p>
        </div>
      </div>

      {/* ── Feature tiles ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Checklist — brand green */}
        <FeatureTile
          href="/couple/checklist"
          bg="bg-brand-green"
          iconBg="bg-white/20"
          icon={<CheckCircle2 className="h-6 w-6 text-white" />}
          stat={`${checklist.pct}%`}
          statLabel="complete"
          sub={`${checklist.done} of ${checklist.total} tasks done`}
          textColor="text-white"
          subColor="text-white/70"
          progress={checklist.pct}
          progressBg="bg-white/20"
        />

        {/* Budget — brand gold */}
        <FeatureTile
          href="/couple/budget"
          bg="bg-brand-gold"
          iconBg="bg-white/25"
          icon={<DollarSign className="h-6 w-6 text-white" />}
          stat={budget.total > 0 ? fmt(Math.max(0, budget.remaining)) : "—"}
          statLabel={budget.total > 0 ? "remaining" : ""}
          sub={budget.total > 0 ? `of ${fmt(budget.total)} budget · ${fmt(budget.spent)} spent` : "Set your budget to get started"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Timeline — brand coral */}
        <FeatureTile
          href="/couple/timeline"
          bg="bg-brand-coral"
          iconBg="bg-white/20"
          icon={<Clock className="h-6 w-6 text-white" />}
          stat={String(timelineCount)}
          statLabel={timelineCount === 1 ? "entry" : "entries"}
          sub={timelineCount > 0 ? "View your day-of schedule" : "Generate your day-of timeline"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Vendors — brand peach */}
        <FeatureTile
          href="/couple/vendors"
          bg="bg-brand-peach"
          iconBg="bg-white/20"
          icon={<Users className="h-6 w-6 text-white" />}
          stat={String(bookedVendors)}
          statLabel={bookedVendors === 1 ? "vendor" : "vendors"}
          sub={vendors.length > 0 ? `${bookedVendors} booked · ${vendors.length - bookedVendors} still shopping` : "Add your vendors"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Notes — soft gold tint (coming soon) */}
        <FeatureTile
          href="/couple/notes"
          bg="bg-[#FBE9C8]"
          iconBg="bg-[#F5C27A]/40"
          icon={<FileText className="h-6 w-6 text-[#B8862A]" />}
          stat="Notes"
          statLabel=""
          sub="Capture ideas, reminders & inspiration"
          textColor="text-[#7A5A1A]"
          subColor="text-[#9A7A3A]"
          comingSoon
        />

        {/* Moodboard — blush (coming soon) */}
        <FeatureTile
          href="/couple/moodboard"
          bg="bg-[#FAE8E4]"
          iconBg="bg-[#F0A896]/40"
          icon={<ImageIcon className="h-6 w-6 text-[#A8503A]" />}
          stat="Moodboard"
          statLabel=""
          sub="Save inspiration photos for your big day"
          textColor="text-[#7A2A1A]"
          subColor="text-[#9A4A3A]"
          comingSoon
        />
      </div>
    </div>
  )
}

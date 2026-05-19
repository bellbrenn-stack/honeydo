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
            style={{ fontFamily: "var(--font-playfair)" }}
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
      <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.97_0.04_68)] border border-[oklch(0.91_0.05_68)] px-8 py-8">
        {/* Decorative circles */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[oklch(0.92_0.08_44)]/40 pointer-events-none" />
        <div className="absolute -right-4 -bottom-10 h-32 w-32 rounded-full bg-[oklch(0.88_0.06_140)]/40 pointer-events-none" />
        <div className="absolute right-36 -bottom-8 h-20 w-20 rounded-full bg-[oklch(0.92_0.06_18)]/30 pointer-events-none" />

        <div className="relative flex flex-col gap-1">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-[oklch(0.54_0.08_44)]">
            <Heart className="h-4 w-4 fill-[oklch(0.64_0.15_44)] text-[oklch(0.64_0.15_44)]" />
            <span className="text-sm font-medium tracking-wide uppercase">{wedding.name}</span>
          </div>

          {/* Countdown number */}
          {daysUntil !== null ? (
            <div className="flex items-end gap-3 mt-1">
              <span
                className="text-8xl font-bold leading-none text-[oklch(0.34_0.10_44)]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {daysUntil}
              </span>
              <div className="flex flex-col pb-2 text-[oklch(0.48_0.08_44)]">
                <span className="text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                  {daysUntil === 0 ? "Today's" : "days"}
                </span>
                <span className="text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                  {daysUntil === 0 ? "the day!" : "to go"}
                </span>
              </div>
            </div>
          ) : (
            <p
              className="text-3xl font-semibold text-[oklch(0.48_0.08_44)] mt-1"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Set your wedding date
            </p>
          )}

          {/* Date line */}
          <p className="text-sm text-[oklch(0.54_0.06_60)] mt-1">
            {wedding.weddingDate
              ? format(new Date(wedding.weddingDate), "EEEE, MMMM d, yyyy")
              : "No date set yet · add one in Settings"}
            {wedding.venue ? ` · ${wedding.venue}` : ""}
          </p>

          {/* Tagline */}
          <p
            className="text-base italic text-[oklch(0.58_0.08_44)]/70 mt-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            make planning sweet
          </p>
        </div>
      </div>

      {/* ── Feature tiles ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Checklist — sage green */}
        <FeatureTile
          href="/couple/checklist"
          bg="bg-[oklch(0.54_0.14_130)]"
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

        {/* Budget — cantaloupe */}
        <FeatureTile
          href="/couple/budget"
          bg="bg-[oklch(0.64_0.15_44)]"
          iconBg="bg-white/20"
          icon={<DollarSign className="h-6 w-6 text-white" />}
          stat={budget.total > 0 ? fmt(Math.max(0, budget.remaining)) : "—"}
          statLabel={budget.total > 0 ? "remaining" : ""}
          sub={budget.total > 0 ? `of ${fmt(budget.total)} budget · ${fmt(budget.spent)} spent` : "Set your budget to get started"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Timeline — coral */}
        <FeatureTile
          href="/couple/timeline"
          bg="bg-[oklch(0.60_0.16_18)]"
          iconBg="bg-white/20"
          icon={<Clock className="h-6 w-6 text-white" />}
          stat={String(timelineCount)}
          statLabel={timelineCount === 1 ? "entry" : "entries"}
          sub={timelineCount > 0 ? "View your day-of schedule" : "Generate your day-of timeline"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Vendors — warm peach */}
        <FeatureTile
          href="/couple/vendors"
          bg="bg-[oklch(0.72_0.12_38)]"
          iconBg="bg-white/20"
          icon={<Users className="h-6 w-6 text-white" />}
          stat={String(bookedVendors)}
          statLabel={bookedVendors === 1 ? "vendor" : "vendors"}
          sub={vendors.length > 0 ? `${bookedVendors} booked · ${vendors.length - bookedVendors} still shopping` : "Add your vendors"}
          textColor="text-white"
          subColor="text-white/70"
        />

        {/* Notes — warm gold (coming soon) */}
        <FeatureTile
          href="/couple/notes"
          bg="bg-[oklch(0.86_0.10_78)]"
          iconBg="bg-[oklch(0.76_0.10_78)]"
          icon={<FileText className="h-6 w-6 text-[oklch(0.42_0.08_72)]" />}
          stat="Notes"
          statLabel=""
          sub="Capture ideas, reminders & inspiration"
          textColor="text-[oklch(0.32_0.08_65)]"
          subColor="text-[oklch(0.42_0.06_65)]"
          comingSoon
        />

        {/* Moodboard — blush (coming soon) */}
        <FeatureTile
          href="/couple/moodboard"
          bg="bg-[oklch(0.90_0.06_350)]"
          iconBg="bg-[oklch(0.82_0.06_350)]"
          icon={<ImageIcon className="h-6 w-6 text-[oklch(0.48_0.08_340)]" />}
          stat="Moodboard"
          statLabel=""
          sub="Save inspiration photos for your big day"
          textColor="text-[oklch(0.34_0.07_340)]"
          subColor="text-[oklch(0.44_0.05_340)]"
          comingSoon
        />
      </div>
    </div>
  )
}

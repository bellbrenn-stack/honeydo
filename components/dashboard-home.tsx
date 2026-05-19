"use client"

import { useMemo } from "react"
import { differenceInDays, format, isPast } from "date-fns"
import { Heart, Calendar, CheckCircle2, DollarSign, Users, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type {
  Wedding,
  ChecklistItem,
  BudgetItem,
  Vendor,
} from "@/lib/generated/prisma/client"

interface Props {
  wedding: Wedding
  checklistItems: ChecklistItem[]
  budgetItems: BudgetItem[]
  vendors: Vendor[]
}

export function DashboardHome({ wedding, checklistItems, budgetItems, vendors }: Props) {
  const daysUntil = useMemo(() => {
    if (!wedding.weddingDate) return null
    return differenceInDays(new Date(wedding.weddingDate), new Date())
  }, [wedding.weddingDate])

  const checklistProgress = useMemo(() => {
    const total = checklistItems.length
    const done = checklistItems.filter((i) => i.status === "COMPLETED").length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [checklistItems])

  const budgetSummary = useMemo(() => {
    const total = wedding.budget ?? 0
    const spent = budgetItems.reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0)
    const remaining = total - spent
    return { total, spent, remaining }
  }, [budgetItems, wedding.budget])

  const upcomingTasks = useMemo(() => {
    return checklistItems
      .filter((i) => i.status !== "COMPLETED" && i.status !== "SKIPPED")
      .filter((i) => {
        if (!i.dueDate && !i.dueOffsetDays) return true
        if (i.dueDate) return !isPast(new Date(i.dueDate))
        return true
      })
      .slice(0, 5)
  }, [checklistItems])

  const upcomingPayments = useMemo(() => {
    return budgetItems
      .filter((b) => b.paymentStatus !== "PAID_IN_FULL")
      .filter((b) => b.depositDueDate || b.balanceDueDate)
      .sort((a, b) => {
        const dateA = new Date(a.depositDueDate ?? a.balanceDueDate ?? 0)
        const dateB = new Date(b.depositDueDate ?? b.balanceDueDate ?? 0)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 4)
  }, [budgetItems])

  const bookedVendors = vendors.filter((v) => v.booked).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{wedding.name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {wedding.weddingDate
            ? format(new Date(wedding.weddingDate), "MMMM d, yyyy")
            : "Wedding date not set"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Countdown — cantaloupe */}
        <Card className="border-0 bg-[oklch(0.94_0.08_50)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.42_0.08_44)]">
              Days to go
            </CardTitle>
            <Heart className="h-4 w-4 fill-primary text-primary" />
          </CardHeader>
          <CardContent>
            {daysUntil !== null ? (
              <>
                <p className="text-4xl font-bold text-[oklch(0.42_0.10_44)]">
                  {daysUntil > 0 ? daysUntil : 0}
                </p>
                <p className="text-xs text-[oklch(0.52_0.06_44)] mt-1">
                  {daysUntil > 0 ? "until your big day" : "Today's the day!"}
                </p>
              </>
            ) : (
              <p className="text-sm text-[oklch(0.52_0.06_44)]">Set your wedding date</p>
            )}
          </CardContent>
        </Card>

        {/* Checklist progress — sage */}
        <Card className="border-0 bg-[oklch(0.92_0.06_140)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.38_0.08_140)]">
              Planning progress
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[oklch(0.48_0.10_140)]" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[oklch(0.38_0.08_140)]">{checklistProgress.pct}%</p>
            <Progress value={checklistProgress.pct} className="mt-2 h-1.5 bg-[oklch(0.82_0.06_140)]" />
            <p className="text-xs text-[oklch(0.48_0.08_140)] mt-1">
              {checklistProgress.done} of {checklistProgress.total} tasks done
            </p>
          </CardContent>
        </Card>

        {/* Budget — barley gold */}
        <Card className="border-0 bg-[oklch(0.94_0.07_82)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.42_0.07_75)]">
              Budget remaining
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[oklch(0.52_0.09_75)]" />
          </CardHeader>
          <CardContent>
            {budgetSummary.total > 0 ? (
              <>
                <p className="text-4xl font-bold text-[oklch(0.42_0.08_75)]">
                  ${budgetSummary.remaining.toLocaleString()}
                </p>
                <p className="text-xs text-[oklch(0.52_0.06_75)] mt-1">
                  of ${budgetSummary.total.toLocaleString()} budget
                </p>
              </>
            ) : (
              <p className="text-sm text-[oklch(0.52_0.06_75)]">Set your budget</p>
            )}
          </CardContent>
        </Card>

        {/* Vendors — guava coral */}
        <Card className="border-0 bg-[oklch(0.94_0.05_18)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.42_0.08_18)]">
              Vendors booked
            </CardTitle>
            <Users className="h-4 w-4 text-[oklch(0.52_0.10_18)]" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[oklch(0.42_0.08_18)]">{bookedVendors}</p>
            <p className="text-xs text-[oklch(0.52_0.08_18)] mt-1">
              of {vendors.length} vendors added
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up!</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{task.title}</span>
                  <Badge
                    variant={task.status === "IN_PROGRESS" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {task.category.toLowerCase().replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming payments */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <AlertCircle className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Payment reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming payments</p>
            ) : (
              upcomingPayments.map((payment) => {
                const dueDate = payment.depositDueDate ?? payment.balanceDueDate
                const amount =
                  payment.paymentStatus === "UNPAID"
                    ? payment.depositAmount ?? payment.estimatedCost
                    : (payment.actualCost ?? payment.estimatedCost) -
                      (payment.depositAmount ?? 0)
                return (
                  <div key={payment.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate font-medium">{payment.name}</p>
                      {dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(dueDate), "MMM d")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold shrink-0 text-primary">
                      ${(amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

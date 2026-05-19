"use client"

import { useState, useMemo, useTransition } from "react"
import { addDays, format, isPast, isWithinInterval, addDays as addD } from "date-fns"
import {
  CheckCircle2,
  Circle,
  MinusCircle,
  SkipForward,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ChecklistItem, Wedding } from "@/lib/generated/prisma/client"

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
type FilterTab = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED"

const CATEGORY_LABELS: Record<string, string> = {
  VENUE: "Venue",
  CATERING: "Catering",
  PHOTOGRAPHY: "Photography",
  VIDEOGRAPHY: "Videography",
  FLORALS: "Florals",
  ATTIRE: "Attire",
  BEAUTY: "Beauty",
  MUSIC: "Music",
  OFFICIANT: "Officiant",
  TRANSPORTATION: "Transportation",
  STATIONERY: "Stationery",
  HONEYMOON: "Honeymoon",
  CEREMONY: "Ceremony",
  RECEPTION: "Reception",
  LOGISTICS: "Logistics",
  LEGAL: "Legal",
  OTHER: "Other",
}

// Each category gets a fruit-palette color pair [bg, text]
const CATEGORY_COLORS: Record<string, [string, string]> = {
  VENUE:          ["bg-[oklch(0.92_0.08_50)]",  "text-[oklch(0.40_0.10_44)]"],
  CATERING:       ["bg-[oklch(0.93_0.06_78)]",  "text-[oklch(0.42_0.08_72)]"],
  PHOTOGRAPHY:    ["bg-[oklch(0.91_0.06_140)]", "text-[oklch(0.36_0.08_140)]"],
  VIDEOGRAPHY:    ["bg-[oklch(0.91_0.06_140)]", "text-[oklch(0.36_0.08_140)]"],
  FLORALS:        ["bg-[oklch(0.92_0.06_140)]", "text-[oklch(0.38_0.08_140)]"],
  ATTIRE:         ["bg-[oklch(0.93_0.05_18)]",  "text-[oklch(0.42_0.10_18)]"],
  BEAUTY:         ["bg-[oklch(0.93_0.05_18)]",  "text-[oklch(0.42_0.10_18)]"],
  MUSIC:          ["bg-[oklch(0.93_0.07_82)]",  "text-[oklch(0.42_0.08_78)]"],
  OFFICIANT:      ["bg-[oklch(0.93_0.07_82)]",  "text-[oklch(0.42_0.08_78)]"],
  TRANSPORTATION: ["bg-[oklch(0.92_0.08_50)]",  "text-[oklch(0.40_0.10_44)]"],
  STATIONERY:     ["bg-[oklch(0.93_0.06_78)]",  "text-[oklch(0.42_0.08_72)]"],
  HONEYMOON:      ["bg-[oklch(0.92_0.06_140)]", "text-[oklch(0.36_0.08_140)]"],
  CEREMONY:       ["bg-[oklch(0.93_0.05_18)]",  "text-[oklch(0.42_0.10_18)]"],
  RECEPTION:      ["bg-[oklch(0.92_0.08_50)]",  "text-[oklch(0.40_0.10_44)]"],
  LOGISTICS:      ["bg-[oklch(0.93_0.07_82)]",  "text-[oklch(0.42_0.08_72)]"],
  LEGAL:          ["bg-[oklch(0.93_0.05_18)]",  "text-[oklch(0.42_0.10_18)]"],
  OTHER:          ["bg-[oklch(0.94_0.02_80)]",  "text-[oklch(0.45_0.02_60)]"],
}

function getDueDate(item: ChecklistItem, weddingDate: Date | null): Date | null {
  if (item.dueDate) return new Date(item.dueDate)
  if (item.dueOffsetDays !== null && weddingDate) {
    return addDays(weddingDate, item.dueOffsetDays)
  }
  return null
}

function DueDateLabel({ dueDate, status }: { dueDate: Date | null; status: Status }) {
  if (!dueDate || status === "COMPLETED" || status === "SKIPPED") return null
  const today = new Date()
  const overdue = isPast(dueDate)
  const soon = isWithinInterval(dueDate, { start: today, end: addD(today, 30) })

  return (
    <span
      className={cn(
        "text-xs",
        overdue ? "text-destructive font-medium" : soon ? "text-[oklch(0.52_0.10_44)]" : "text-muted-foreground"
      )}
    >
      {overdue ? "Overdue · " : ""}
      {format(dueDate, "MMM d")}
    </span>
  )
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "COMPLETED")
    return <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#8DB870" }} />
  if (status === "IN_PROGRESS")
    return <MinusCircle className="h-5 w-5 shrink-0" style={{ color: "#F5C27A" }} />
  if (status === "SKIPPED")
    return <SkipForward className="h-5 w-5 text-muted-foreground shrink-0" />
  return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
}

interface Props {
  wedding: Wedding
  initialItems: ChecklistItem[]
}

export function ChecklistView({ wedding, initialItems }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [filter, setFilter] = useState<FilterTab>("ALL")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("OTHER")
  const [newDueDate, setNewDueDate] = useState("")
  const [isPending, startTransition] = useTransition()

  const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null

  const progress = useMemo(() => {
    const done = items.filter((i) => i.status === "COMPLETED").length
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 }
  }, [items])

  const filteredItems = useMemo(() => {
    if (filter === "ALL") return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>()
    for (const item of filteredItems) {
      const cat = item.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    // Sort each group by dueDate
    for (const [, list] of map) {
      list.sort((a, b) => {
        const da = getDueDate(a, weddingDate)?.getTime() ?? Infinity
        const db = getDueDate(b, weddingDate)?.getTime() ?? Infinity
        return da - db
      })
    }
    return map
  }, [filteredItems, weddingDate])

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  async function cycleStatus(item: ChecklistItem) {
    const current = item.status as Status
    const next: Status =
      current === "PENDING" ? "IN_PROGRESS"
      : current === "IN_PROGRESS" ? "COMPLETED"
      : current === "COMPLETED" ? "PENDING"
      : "PENDING"

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)))

    startTransition(async () => {
      const res = await fetch(`/api/checklist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)))
        toast.error("Failed to update task")
      }
    })
  }

  async function deleteItem(item: ChecklistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    startTransition(async () => {
      const res = await fetch(`/api/checklist/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        setItems((prev) => [...prev, item])
        toast.error("Failed to delete task")
      }
    })
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return

    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), category: newCategory, dueDate: newDueDate || undefined }),
    })

    if (!res.ok) {
      toast.error("Failed to add task")
      return
    }

    const item = await res.json()
    setItems((prev) => [...prev, item])
    setNewTitle("")
    setNewCategory("OTHER")
    setNewDueDate("")
    setAddOpen(false)
    toast.success("Task added")
  }

  const pendingCount = items.filter((i) => i.status === "PENDING").length
  const inProgressCount = items.filter((i) => i.status === "IN_PROGRESS").length
  const completedCount = items.filter((i) => i.status === "COMPLETED").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planning Checklist</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {progress.done} of {progress.total} tasks completed
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={
            <Button
              size="sm"
              className="gap-1.5 shrink-0 rounded-full px-5"
              style={{ background: "#8DB870", color: "#fff", boxShadow: "0 2px 8px rgba(141,184,112,0.3)" }}
            >
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a custom task</DialogTitle>
            </DialogHeader>
            <form onSubmit={addItem} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="new-title">Task name</Label>
                <Input
                  id="new-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Order wedding favors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category">Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v ?? "OTHER")}>
                  <SelectTrigger id="new-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-due">Due date (optional)</Label>
                <Input
                  id="new-due"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <Progress value={progress.pct} className="h-2" />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{pendingCount} pending</span>
          <span>{inProgressCount} in progress</span>
          <span>{completedCount} completed</span>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="ALL">All ({items.length})</TabsTrigger>
          <TabsTrigger value="PENDING">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress ({inProgressCount})</TabsTrigger>
          <TabsTrigger value="COMPLETED">Done ({completedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grouped items */}
      <div className="space-y-3">
        {grouped.size === 0 && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div
              className="flex items-center justify-center w-20 h-20 rounded-3xl text-4xl"
              style={{ background: "#FEF0D6" }}
            >
              🐝
            </div>
            <div>
              <p
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "#1A1A0F" }}
              >
                Nothing to do yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Enjoy the honey! Your planning checklist will appear here.
              </p>
            </div>
          </div>
        )}
        {grouped.size === 0 && items.length > 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No tasks in this view.</p>
        )}
        {[...grouped.entries()].map(([category, catItems]) => {
          const collapsed = collapsedCategories.has(category)
          const [bg, text] = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER
          const catDone = catItems.filter((i) => i.status === "COMPLETED").length

          return (
            <div key={category} className="rounded-xl border bg-card overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {collapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                  <span className="font-medium text-sm">{CATEGORY_LABELS[category] ?? category}</span>
                  <Badge className={cn("text-xs font-normal border-0", bg, text)}>
                    {catDone}/{catItems.length}
                  </Badge>
                </div>
              </button>

              {/* Items */}
              {!collapsed && (
                <div className="divide-y">
                  {catItems.map((item) => {
                    const dueDate = getDueDate(item, weddingDate)
                    const done = item.status === "COMPLETED"
                    const skipped = item.status === "SKIPPED"
                    const overdue = dueDate ? isPast(dueDate) && !done && !skipped : false
                    const inProgress = item.status === "IN_PROGRESS"

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-muted/30 border-l-4",
                          (done || skipped) && "opacity-60"
                        )}
                        style={{
                          borderLeftColor: done
                            ? "#8DB870"
                            : overdue
                            ? "#E8674A"
                            : inProgress
                            ? "#F5C27A"
                            : "transparent",
                        }}
                      >
                        <button
                          onClick={() => cycleStatus(item)}
                          disabled={isPending}
                          className="shrink-0 focus:outline-none"
                          title="Click to advance status"
                        >
                          <StatusIcon status={item.status as Status} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", done && "line-through text-muted-foreground")}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <DueDateLabel dueDate={dueDate} status={item.status as Status} />
                            {item.isCustom && (
                              <span className="text-xs text-muted-foreground">Custom</span>
                            )}
                          </div>
                        </div>

                        {/* Delete custom items on hover */}
                        {item.isCustom && (
                          <button
                            onClick={() => deleteItem(item)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

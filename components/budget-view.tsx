"use client"

import { useState, useMemo, useTransition } from "react"
import { format, isPast, isWithinInterval, addDays } from "date-fns"
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { BudgetItem, Wedding, Vendor } from "@/lib/generated/prisma/client"

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  VENUE: "Venue", CATERING: "Catering", PHOTOGRAPHY: "Photography",
  VIDEOGRAPHY: "Videography", FLORALS: "Florals", ATTIRE: "Attire",
  BEAUTY: "Beauty", MUSIC: "Music", OFFICIANT: "Officiant",
  TRANSPORTATION: "Transportation", STATIONERY: "Stationery",
  HONEYMOON: "Honeymoon", DECOR: "Decor", RENTALS: "Rentals",
  LIGHTING: "Lighting", CAKE: "Cake", FAVORS: "Favors", OTHER: "Other",
}

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
  HONEYMOON:      ["bg-[oklch(0.91_0.06_140)]", "text-[oklch(0.36_0.08_140)]"],
  DECOR:          ["bg-[oklch(0.92_0.08_50)]",  "text-[oklch(0.40_0.10_44)]"],
  RENTALS:        ["bg-[oklch(0.93_0.06_78)]",  "text-[oklch(0.42_0.08_72)]"],
  LIGHTING:       ["bg-[oklch(0.93_0.07_82)]",  "text-[oklch(0.42_0.08_78)]"],
  CAKE:           ["bg-[oklch(0.93_0.05_18)]",  "text-[oklch(0.42_0.10_18)]"],
  FAVORS:         ["bg-[oklch(0.93_0.07_82)]",  "text-[oklch(0.42_0.08_78)]"],
  OTHER:          ["bg-[oklch(0.94_0.02_80)]",  "text-[oklch(0.45_0.02_60)]"],
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  DEPOSIT_PAID: "Deposit paid",
  PAID_IN_FULL: "Paid in full",
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-[oklch(0.93_0.05_18)] text-[oklch(0.42_0.10_18)] border-0",
  DEPOSIT_PAID: "bg-[oklch(0.93_0.07_82)] text-[oklch(0.42_0.08_72)] border-0",
  PAID_IN_FULL: "bg-[oklch(0.91_0.06_140)] text-[oklch(0.36_0.08_140)] border-0",
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemFormData = {
  name: string
  category: string
  estimatedCost: string
  actualCost: string
  depositAmount: string
  depositDueDate: string
  balanceDueDate: string
  paymentStatus: string
  notes: string
}

const EMPTY_FORM: ItemFormData = {
  name: "", category: "OTHER", estimatedCost: "", actualCost: "",
  depositAmount: "", depositDueDate: "", balanceDueDate: "",
  paymentStatus: "UNPAID", notes: "",
}

function itemToForm(item: BudgetItem): ItemFormData {
  return {
    name: item.name,
    category: item.category,
    estimatedCost: item.estimatedCost.toString(),
    actualCost: item.actualCost?.toString() ?? "",
    depositAmount: item.depositAmount?.toString() ?? "",
    depositDueDate: item.depositDueDate ? format(new Date(item.depositDueDate), "yyyy-MM-dd") : "",
    balanceDueDate: item.balanceDueDate ? format(new Date(item.balanceDueDate), "yyyy-MM-dd") : "",
    paymentStatus: item.paymentStatus,
    notes: item.notes ?? "",
  }
}

// ─── Item Form Dialog ─────────────────────────────────────────────────────────

function ItemDialog({
  open, onClose, initial, onSave,
}: {
  open: boolean
  onClose: () => void
  initial: ItemFormData
  onSave: (data: ItemFormData) => Promise<void>
}) {
  const [form, setForm] = useState<ItemFormData>(initial)
  const [saving, setSaving] = useState(false)

  function set(key: keyof ItemFormData, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  // Reset form when dialog opens with new initial values
  useState(() => { setForm(initial) })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.name ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. The Hive Venue" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v ?? "OTHER")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => set("paymentStatus", v ?? "UNPAID")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="est">Estimated cost</Label>
              <Input id="est" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => set("estimatedCost", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="actual">Actual cost</Label>
              <Input id="actual" type="number" min="0" step="0.01" value={form.actualCost} onChange={(e) => set("actualCost", e.target.value)} placeholder="—" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit">Deposit amount</Label>
              <Input id="deposit" type="number" min="0" step="0.01" value={form.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} placeholder="—" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-due">Deposit due</Label>
              <Input id="dep-due" type="date" value={form.depositDueDate} onChange={(e) => set("depositDueDate", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="bal-due">Balance due date</Label>
              <Input id="bal-due" type="date" value={form.balanceDueDate} onChange={(e) => set("balanceDueDate", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Contract #, contact info…" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  wedding: Wedding
  initialItems: BudgetItem[]
  vendors: Vendor[]
}

export function BudgetView({ wedding, initialItems, vendors: _vendors }: Props) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [totalBudget, setTotalBudget] = useState<number>(wedding.budget ?? 0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState((wedding.budget ?? 0).toString())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [, startTransition] = useTransition()

  // ── Summary ──────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const estimated = items.reduce((s, i) => s + i.estimatedCost, 0)
    const actual = items.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0)
    const remaining = totalBudget - actual
    const pct = totalBudget > 0 ? Math.min(100, Math.round((actual / totalBudget) * 100)) : 0
    return { estimated, actual, remaining, pct }
  }, [items, totalBudget])

  // ── Upcoming payments ────────────────────────────────────────────────────

  const upcomingPayments = useMemo(() => {
    const today = new Date()
    const soon = addDays(today, 60)
    return items
      .filter((i) => i.paymentStatus !== "PAID_IN_FULL")
      .filter((i) => {
        const d = i.paymentStatus === "UNPAID" ? i.depositDueDate : i.balanceDueDate
        return d && isWithinInterval(new Date(d), { start: today, end: soon })
      })
      .sort((a, b) => {
        const da = a.paymentStatus === "UNPAID" ? a.depositDueDate : a.balanceDueDate
        const db = b.paymentStatus === "UNPAID" ? b.depositDueDate : b.balanceDueDate
        return new Date(da!).getTime() - new Date(db!).getTime()
      })
  }, [items])

  // ── Category groups ───────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const map = new Map<string, BudgetItem[]>()
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [items])

  // ── Category bar data ─────────────────────────────────────────────────────

  const categoryTotals = useMemo(() => {
    return [...grouped.entries()].map(([cat, catItems]) => {
      const est = catItems.reduce((s, i) => s + i.estimatedCost, 0)
      const act = catItems.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0)
      const pct = totalBudget > 0 ? Math.min(100, (act / totalBudget) * 100) : 0
      return { cat, est, act, pct }
    }).sort((a, b) => b.act - a.act)
  }, [grouped, totalBudget])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleCollapse(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  async function saveTotalBudget() {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return
    setTotalBudget(val)
    setEditingBudget(false)
    startTransition(async () => {
      const res = await fetch("/api/wedding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: val }),
      })
      if (!res.ok) toast.error("Failed to update budget")
    })
  }

  async function handleSave(form: ItemFormData) {
    const payload = {
      name: form.name,
      category: form.category,
      estimatedCost: parseFloat(form.estimatedCost) || 0,
      actualCost: form.actualCost ? parseFloat(form.actualCost) : null,
      depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : null,
      depositDueDate: form.depositDueDate || null,
      balanceDueDate: form.balanceDueDate || null,
      paymentStatus: form.paymentStatus,
      notes: form.notes || null,
    }

    if (editingItem) {
      const res = await fetch(`/api/budget/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { toast.error("Failed to update"); return }
      const updated = await res.json()
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)))
      toast.success("Expense updated")
    } else {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { toast.error("Failed to add expense"); return }
      const created = await res.json()
      setItems((prev) => [...prev, created])
      toast.success("Expense added")
    }

    setDialogOpen(false)
    setEditingItem(null)
  }

  async function deleteItem(item: BudgetItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    startTransition(async () => {
      const res = await fetch(`/api/budget/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        setItems((prev) => [...prev, item])
        toast.error("Failed to delete")
      }
    })
  }

  function openAdd() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function openEdit(item: BudgetItem) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{items.length} expenses tracked</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total budget — editable */}
        <div className="rounded-xl border-0 bg-[oklch(0.94_0.08_50)] p-4">
          <p className="text-xs font-medium text-[oklch(0.42_0.08_44)] mb-1">Total budget</p>
          {editingBudget ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="h-8 text-lg font-bold bg-white/60 border-0"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveTotalBudget()}
              />
              <button onClick={saveTotalBudget} className="p-1 rounded bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setBudgetInput(totalBudget.toString()); setEditingBudget(true) }}
              className="group flex items-baseline gap-1.5"
              title="Click to edit"
            >
              <span className="text-3xl font-bold text-[oklch(0.38_0.10_44)]">{fmt(totalBudget)}</span>
              <Pencil className="h-3 w-3 text-[oklch(0.52_0.08_44)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Total spent */}
        <div className="rounded-xl border-0 bg-[oklch(0.93_0.06_78)] p-4">
          <p className="text-xs font-medium text-[oklch(0.42_0.08_72)] mb-1">Total spent</p>
          <p className="text-3xl font-bold text-[oklch(0.38_0.08_72)]">{fmt(summary.actual)}</p>
          <p className="text-xs text-[oklch(0.52_0.06_72)] mt-1">{summary.pct}% of budget</p>
        </div>

        {/* Remaining */}
        <div className={cn("rounded-xl border-0 p-4", summary.remaining >= 0 ? "bg-[oklch(0.92_0.06_140)]" : "bg-[oklch(0.93_0.05_18)]")}>
          <p className={cn("text-xs font-medium mb-1", summary.remaining >= 0 ? "text-[oklch(0.38_0.08_140)]" : "text-[oklch(0.42_0.10_18)]")}>
            {summary.remaining >= 0 ? "Remaining" : "Over budget"}
          </p>
          <p className={cn("text-3xl font-bold", summary.remaining >= 0 ? "text-[oklch(0.32_0.08_140)]" : "text-[oklch(0.38_0.10_18)]")}>
            {fmt(Math.abs(summary.remaining))}
          </p>
        </div>

        {/* Estimated total */}
        <div className="rounded-xl border-0 bg-[oklch(0.94_0.07_82)] p-4">
          <p className="text-xs font-medium text-[oklch(0.42_0.08_78)] mb-1">Estimated total</p>
          <p className="text-3xl font-bold text-[oklch(0.38_0.08_75)]">{fmt(summary.estimated)}</p>
          <p className="text-xs text-[oklch(0.52_0.06_75)] mt-1">across all categories</p>
        </div>
      </div>

      {/* Spend progress */}
      <div className="space-y-1.5">
        <Progress value={summary.pct} className="h-2.5" />
        <p className="text-xs text-muted-foreground">{fmt(summary.actual)} spent of {fmt(totalBudget)}</p>
      </div>

      {/* Category breakdown bars */}
      {categoryTotals.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">By category</p>
          {categoryTotals.map(({ cat, act, pct }) => {
            const [bg, text] = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.OTHER
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={cn("font-medium", text.replace("text-", ""))}>{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="text-muted-foreground">{fmt(act)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", bg)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upcoming payments */}
      {upcomingPayments.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-[oklch(0.60_0.12_44)]" />
            <p className="text-sm font-medium">Upcoming payments (next 60 days)</p>
          </div>
          <div className="space-y-2">
            {upcomingPayments.map((item) => {
              const dueDate = item.paymentStatus === "UNPAID" ? item.depositDueDate : item.balanceDueDate
              const amount = item.paymentStatus === "UNPAID"
                ? (item.depositAmount ?? item.estimatedCost)
                : (item.actualCost ?? item.estimatedCost) - (item.depositAmount ?? 0)
              const overdue = dueDate && isPast(new Date(dueDate))
              return (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                      {item.paymentStatus === "UNPAID" ? "Deposit" : "Balance"} due{" "}
                      {dueDate ? format(new Date(dueDate), "MMM d") : ""}
                      {overdue ? " — overdue" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0">{fmt(amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No expenses yet. Add your first one.</p>
          </div>
        )}
        {[...grouped.entries()].map(([cat, catItems]) => {
          const isCollapsed = collapsed.has(cat)
          const [bg, text] = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.OTHER
          const catTotal = catItems.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0)

          return (
            <div key={cat} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => toggleCollapse(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                  <span className="font-medium text-sm">{CATEGORY_LABELS[cat] ?? cat}</span>
                  <Badge className={cn("text-xs font-normal border-0", bg, text)}>
                    {catItems.length} item{catItems.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{fmt(catTotal)}</span>
              </button>

              {!isCollapsed && (
                <div className="divide-y">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <Badge className={cn("text-xs font-normal border-0 shrink-0", PAYMENT_STATUS_STYLES[item.paymentStatus])}>
                            {PAYMENT_STATUS_LABELS[item.paymentStatus]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>Est. {fmt(item.estimatedCost)}</span>
                          {item.actualCost != null && (
                            <span className="flex items-center gap-0.5">
                              <TrendingDown className="h-3 w-3" />
                              Actual {fmt(item.actualCost)}
                            </span>
                          )}
                          {item.depositAmount != null && (
                            <span>Deposit {fmt(item.depositAmount)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add/Edit dialog */}
      <ItemDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingItem(null) }}
        initial={editingItem ? itemToForm(editingItem) : EMPTY_FORM}
        onSave={handleSave}
      />
    </div>
  )
}

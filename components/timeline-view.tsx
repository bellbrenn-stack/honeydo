"use client"

import { useState, useMemo, useTransition } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Wand2,
  Bell,
  Sunset,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { cn } from "@/lib/utils"
import type { TimelineEntry, Wedding } from "@/lib/generated/prisma/client"

// ─── Time helpers ─────────────────────────────────────────────────────────────

function toMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  let [, h, m, period] = match
  let hours = parseInt(h)
  const mins = parseInt(m)
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + mins
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  GETTING_READY: "Getting Ready",
  CEREMONY: "Ceremony",
  PORTRAITS: "Portraits",
  COCKTAIL_HOUR: "Cocktail Hour",
  RECEPTION: "Reception",
  SEND_OFF: "Send Off",
  VENDOR_ARRIVAL: "Vendor Arrival",
  OTHER: "Other",
}

const TYPE_COLORS: Record<string, { dot: string; bg: string; badge: string }> = {
  GETTING_READY:  { dot: "bg-[oklch(0.72_0.10_300)]", bg: "bg-[oklch(0.96_0.03_300)]", badge: "bg-[oklch(0.92_0.06_300)] text-[oklch(0.38_0.10_300)] border-0" },
  CEREMONY:       { dot: "bg-[oklch(0.64_0.15_44)]",  bg: "bg-[oklch(0.97_0.03_44)]",  badge: "bg-[oklch(0.92_0.08_44)] text-[oklch(0.38_0.12_44)] border-0" },
  PORTRAITS:      { dot: "bg-[oklch(0.62_0.16_18)]",  bg: "bg-[oklch(0.97_0.03_18)]",  badge: "bg-[oklch(0.93_0.05_18)] text-[oklch(0.42_0.10_18)] border-0" },
  COCKTAIL_HOUR:  { dot: "bg-[oklch(0.68_0.14_82)]",  bg: "bg-[oklch(0.97_0.02_82)]",  badge: "bg-[oklch(0.93_0.07_82)] text-[oklch(0.42_0.08_72)] border-0" },
  RECEPTION:      { dot: "bg-[oklch(0.56_0.14_280)]", bg: "bg-[oklch(0.97_0.02_280)]", badge: "bg-[oklch(0.92_0.05_280)] text-[oklch(0.38_0.10_280)] border-0" },
  SEND_OFF:       { dot: "bg-[oklch(0.64_0.15_44)]",  bg: "bg-[oklch(0.97_0.03_44)]",  badge: "bg-[oklch(0.92_0.08_44)] text-[oklch(0.38_0.12_44)] border-0" },
  VENDOR_ARRIVAL: { dot: "bg-[oklch(0.52_0.10_140)]", bg: "bg-[oklch(0.96_0.03_140)]", badge: "bg-[oklch(0.91_0.06_140)] text-[oklch(0.36_0.08_140)] border-0" },
  OTHER:          { dot: "bg-[oklch(0.70_0.02_80)]",  bg: "bg-[oklch(0.97_0.01_80)]",  badge: "bg-[oklch(0.94_0.02_80)] text-[oklch(0.45_0.02_60)] border-0" },
}

const TIMELINE_TYPES = Object.keys(TYPE_LABELS)

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

// ─── EntryDialog ──────────────────────────────────────────────────────────────

interface EntryDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Partial<TimelineEntry>
  onSave: (data: {
    title: string
    type: string
    startTime: string
    endTime?: string
    description?: string
    isVendorAlert: boolean
  }) => void
  saving: boolean
}

function EntryDialog({ open, onOpenChange, initial, onSave, saving }: EntryDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [type, setType] = useState(initial?.type ?? "OTHER")
  const [startTime, setStartTime] = useState(initial?.startTime ?? "")
  const [endTime, setEndTime] = useState(initial?.endTime ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [isVendorAlert, setIsVendorAlert] = useState(initial?.isVendorAlert ?? false)

  // Reset when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setTitle(initial?.title ?? "")
      setType(initial?.type ?? "OTHER")
      setStartTime(initial?.startTime ?? "")
      setEndTime(initial?.endTime ?? "")
      setDescription(initial?.description ?? "")
      setIsVendorAlert(initial?.isVendorAlert ?? false)
    }
    onOpenChange(v)
  }

  const handleSubmit = () => {
    if (!title.trim() || !startTime.trim()) return
    onSave({
      title: title.trim(),
      type,
      startTime: startTime.trim(),
      endTime: endTime.trim() || undefined,
      description: description.trim() || undefined,
      isVendorAlert,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit entry" : "Add entry"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ceremony begins"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "OTHER")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start time</Label>
              <Input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 5:00 PM"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End time <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 5:30 PM"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes for this entry…"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="vendor-alert"
              checked={isVendorAlert}
              onCheckedChange={setIsVendorAlert}
            />
            <Label htmlFor="vendor-alert" className="cursor-pointer">
              Vendor alert — notify vendors of this time
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !startTime.trim() || saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── GenerateDialog ───────────────────────────────────────────────────────────

interface GenerateDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onGenerate: (opts: {
    ceremonyTime: string
    hasFirstLook: boolean
    receptionDurationHours: number
    replace: boolean
  }) => void
  generating: boolean
  hasEntries: boolean
}

function GenerateDialog({ open, onOpenChange, onGenerate, generating, hasEntries }: GenerateDialogProps) {
  const [ceremonyTime, setCeremonyTime] = useState("5:00 PM")
  const [hasFirstLook, setHasFirstLook] = useState(false)
  const [receptionDuration, setReceptionDuration] = useState("4")
  const [replace, setReplace] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate day-of timeline</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            We'll build your full day timeline from ceremony time — hair & makeup through grand send-off.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label>Ceremony start time</Label>
            <Input
              value={ceremonyTime}
              onChange={(e) => setCeremonyTime(e.target.value)}
              placeholder="e.g. 5:00 PM"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Reception length</Label>
            <Select value={receptionDuration} onValueChange={(v) => setReceptionDuration(v ?? "4")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h} {h === 1 ? "hour" : "hours"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="first-look"
              checked={hasFirstLook}
              onCheckedChange={setHasFirstLook}
            />
            <Label htmlFor="first-look" className="cursor-pointer">
              Couple has a first look
            </Label>
          </div>

          {hasEntries && (
            <div className="flex items-center gap-3">
              <Switch
                id="replace"
                checked={replace}
                onCheckedChange={setReplace}
              />
              <Label htmlFor="replace" className="cursor-pointer text-destructive">
                Replace existing entries
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => onGenerate({
                ceremonyTime,
                hasFirstLook,
                receptionDurationHours: parseInt(receptionDuration),
                replace,
              })}
              disabled={!ceremonyTime.trim() || generating}
              className="bg-[oklch(0.64_0.15_44)] text-white hover:bg-[oklch(0.58_0.15_44)]"
            >
              <Wand2 className="h-4 w-4 mr-1.5" />
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── TimelineView ─────────────────────────────────────────────────────────────

interface Props {
  wedding: Wedding
  initialEntries: TimelineEntry[]
}

export function TimelineView({ wedding, initialEntries }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TimelineEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const sorted = useMemo(
    () => [...entries].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)),
    [entries]
  )

  const sunsetMins = wedding.sunsetTime ? toMinutes(wedding.sunsetTime) : null

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Generate ──────────────────────────────────────────────────────────────

  function handleGenerate(opts: {
    ceremonyTime: string
    hasFirstLook: boolean
    receptionDurationHours: number
    replace: boolean
  }) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/timeline/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts),
        })
        if (!res.ok) throw new Error()
        const data: TimelineEntry[] = await res.json()
        if (opts.replace) {
          setEntries(data)
        } else {
          setEntries((prev) => [...prev, ...data.filter((d) => !prev.some((p) => p.id === d.id))])
        }
        setGenerateOpen(false)
        toast.success("Timeline generated!")
      } catch {
        toast.error("Couldn't generate timeline")
      }
    })
  }

  // ─── Add ───────────────────────────────────────────────────────────────────

  function handleAdd(data: {
    title: string
    type: string
    startTime: string
    endTime?: string
    description?: string
    isVendorAlert: boolean
  }) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/timeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const entry: TimelineEntry = await res.json()
        setEntries((prev) => [...prev, entry])
        setAddOpen(false)
        toast.success("Entry added")
      } catch {
        toast.error("Couldn't add entry")
      }
    })
  }

  // ─── Edit ──────────────────────────────────────────────────────────────────

  function handleEdit(data: {
    title: string
    type: string
    startTime: string
    endTime?: string
    description?: string
    isVendorAlert: boolean
  }) {
    if (!editEntry) return
    const prev = entries
    const optimistic = entries.map((e) =>
      e.id === editEntry.id ? { ...e, ...data } : e
    )
    setEntries(optimistic as TimelineEntry[])

    startTransition(async () => {
      try {
        const res = await fetch(`/api/timeline/${editEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const updated: TimelineEntry = await res.json()
        setEntries((cur) => cur.map((e) => (e.id === updated.id ? updated : e)))
        setEditEntry(null)
        toast.success("Entry updated")
      } catch {
        setEntries(prev)
        toast.error("Couldn't update entry")
      }
    })
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    const prev = entries
    setEntries((cur) => cur.filter((e) => e.id !== id))
    setDeleteId(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
        toast.success("Entry removed")
      } catch {
        setEntries(prev)
        toast.error("Couldn't remove entry")
      }
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Day-of Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entries.length === 0
              ? "No entries yet — generate a template or add items manually."
              : `${entries.length} entries`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenerateOpen(true)}
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            Generate
          </Button>
          <Button
            size="sm"
            className="bg-[oklch(0.64_0.15_44)] text-white hover:bg-[oklch(0.58_0.15_44)]"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add entry
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 border border-dashed rounded-xl text-center">
          <Clock className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">No timeline entries</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              Click <strong>Generate</strong> to build your full day-of schedule from ceremony time.
            </p>
          </div>
          <Button
            className="bg-[oklch(0.64_0.15_44)] text-white hover:bg-[oklch(0.58_0.15_44)]"
            onClick={() => setGenerateOpen(true)}
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            Generate timeline
          </Button>
        </div>
      )}

      {/* Timeline list */}
      {sorted.length > 0 && (
        <div className="relative flex flex-col">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-3 bottom-3 w-px bg-border" aria-hidden />

          {sorted.map((entry, idx) => {
            const colors = TYPE_COLORS[entry.type] ?? TYPE_COLORS.OTHER
            const expanded = expandedIds.has(entry.id)
            const entryMins = toMinutes(entry.startTime)

            // Insert sunset marker before this entry if sunset falls between prev and this
            const prevMins = idx > 0 ? toMinutes(sorted[idx - 1].startTime) : -Infinity
            const showSunset =
              sunsetMins !== null &&
              sunsetMins > prevMins &&
              sunsetMins <= entryMins

            return (
              <div key={entry.id}>
                {showSunset && (
                  <div className="relative flex items-center gap-3 py-2 pl-12 pr-4 mb-1">
                    <div className="absolute left-[14px] flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[oklch(0.90_0.12_60)] z-10">
                      <Sunset className="h-3 w-3 text-[oklch(0.52_0.14_44)]" />
                    </div>
                    <span className="text-xs font-medium text-[oklch(0.52_0.14_44)]">
                      Sunset · {wedding.sunsetTime}
                    </span>
                  </div>
                )}

                <div className="relative group flex gap-3 pb-3">
                  {/* Dot */}
                  <div
                    className={cn(
                      "relative z-10 mt-3.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-background",
                      "ml-[17px]",
                      colors.dot
                    )}
                  />

                  {/* Card */}
                  <div
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-3 transition-shadow hover:shadow-sm",
                      colors.bg
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm leading-snug">{entry.title}</span>
                          {entry.isVendorAlert && (
                            <Badge className="bg-[oklch(0.92_0.08_44)] text-[oklch(0.38_0.12_44)] border-0 gap-1 text-[10px] px-1.5 py-0">
                              <Bell className="h-2.5 w-2.5" />
                              Vendor alert
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {entry.startTime}
                            {entry.endTime ? ` – ${entry.endTime}` : ""}
                          </span>
                          <Badge className={cn("ml-1 text-[10px] px-1.5 py-0", colors.badge)}>
                            {TYPE_LABELS[entry.type] ?? entry.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.description && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleExpand(entry.id)}
                          >
                            {expanded
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditEntry(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {entry.description && expanded && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t pt-2">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate dialog */}
      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerate={handleGenerate}
        generating={isPending}
        hasEntries={entries.length > 0}
      />

      {/* Add dialog */}
      <EntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAdd}
        saving={isPending}
      />

      {/* Edit dialog */}
      {editEntry && (
        <EntryDialog
          open={!!editEntry}
          onOpenChange={(v) => { if (!v) setEditEntry(null) }}
          initial={editEntry}
          onSave={handleEdit}
          saving={isPending}
        />
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove entry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the timeline entry.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  ceremonyTime: z.string().min(1),  // e.g. "5:00 PM"
  hasFirstLook: z.boolean().default(false),
  receptionDurationHours: z.number().min(1).max(8).default(4),
  replace: z.boolean().default(false),
})

// Convert "5:00 PM" → minutes since midnight
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

// Convert minutes since midnight → "5:00 PM"
function fromMinutes(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440
  const h24 = Math.floor(total / 60)
  const m = total % 60
  const period = h24 >= 12 ? "PM" : "AM"
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`
}

function addMins(time: string, offset: number): string {
  return fromMinutes(toMinutes(time) + offset)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding" }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { ceremonyTime, hasFirstLook, receptionDurationHours, replace } = parsed.data

  if (replace) {
    await prisma.timelineEntry.deleteMany({ where: { weddingId } })
  }

  type EntryTemplate = {
    type: string
    title: string
    description?: string
    startOffset: number   // minutes from ceremony
    durationMins: number
    isVendorAlert?: boolean
  }

  const templates: EntryTemplate[] = [
    // Morning / getting ready
    {
      type: "GETTING_READY",
      title: "Hair & makeup begins",
      description: "Bridal party hair and makeup. Start with bridesmaids, bride last.",
      startOffset: -240,
      durationMins: 30,
      isVendorAlert: true,
    },
    {
      type: "VENDOR_ARRIVAL",
      title: "Photographer arrives",
      description: "Captures getting-ready detail shots — dress, rings, florals.",
      startOffset: -180,
      durationMins: 0,
      isVendorAlert: true,
    },
    {
      type: "GETTING_READY",
      title: "Bride into dress",
      startOffset: -90,
      durationMins: 30,
    },
    // First look (conditional)
    ...(hasFirstLook ? [{
      type: "PORTRAITS",
      title: "First look",
      description: "Private first look moment between couple. Allow 20–30 min.",
      startOffset: -60,
      durationMins: 30,
    }] : []),
    // Wedding party portraits before ceremony if first look
    ...(hasFirstLook ? [{
      type: "PORTRAITS",
      title: "Wedding party portraits",
      description: "Full wedding party photos before guests arrive.",
      startOffset: -30,
      durationMins: 30,
    }] : []),
    // Ceremony
    {
      type: "VENDOR_ARRIVAL",
      title: "All vendors in place",
      description: "DJ/band, caterer, florist, officiant all on-site and set up.",
      startOffset: -30,
      durationMins: 0,
      isVendorAlert: true,
    },
    {
      type: "CEREMONY",
      title: "Guests seated",
      startOffset: -15,
      durationMins: 15,
    },
    {
      type: "CEREMONY",
      title: "Ceremony begins",
      description: "Processional, vows, ring exchange, pronouncement.",
      startOffset: 0,
      durationMins: 30,
    },
    {
      type: "CEREMONY",
      title: "Ceremony ends — recessional",
      startOffset: 30,
      durationMins: 10,
    },
    // Post-ceremony
    {
      type: "COCKTAIL_HOUR",
      title: "Cocktail hour begins",
      description: "Guests enjoy cocktails while wedding party takes photos.",
      startOffset: 40,
      durationMins: 60,
      isVendorAlert: true,
    },
    // Portraits — family first if no first look
    ...(!hasFirstLook ? [{
      type: "PORTRAITS",
      title: "Family formals",
      description: "Immediate family photos. Keep list to 6–8 groupings max.",
      startOffset: 40,
      durationMins: 30,
    }] : []),
    {
      type: "PORTRAITS",
      title: "Couple portraits",
      description: "Romantic portraits of just the two of you. Allow at least 30 minutes.",
      startOffset: hasFirstLook ? 40 : 70,
      durationMins: 30,
    },
    // Reception
    {
      type: "RECEPTION",
      title: "Grand entrance",
      description: "DJ introduces wedding party then newlyweds.",
      startOffset: 100,
      durationMins: 10,
    },
    {
      type: "RECEPTION",
      title: "First dance",
      startOffset: 110,
      durationMins: 5,
    },
    {
      type: "RECEPTION",
      title: "Parent dances",
      description: "Father-daughter and mother-son dances.",
      startOffset: 115,
      durationMins: 10,
    },
    {
      type: "RECEPTION",
      title: "Dinner service begins",
      startOffset: 125,
      durationMins: receptionDurationHours * 60 - 60,
      isVendorAlert: true,
    },
    {
      type: "RECEPTION",
      title: "Toasts & speeches",
      description: "Best man, maid of honor, family. Keep each to 3–5 minutes.",
      startOffset: 130,
      durationMins: 20,
    },
    {
      type: "RECEPTION",
      title: "Cake cutting",
      startOffset: 160,
      durationMins: 15,
    },
    {
      type: "RECEPTION",
      title: "Open dancing",
      startOffset: 175,
      durationMins: receptionDurationHours * 60 - 90,
    },
    {
      type: "SEND_OFF",
      title: "Last dance",
      startOffset: 100 + receptionDurationHours * 60 - 15,
      durationMins: 5,
    },
    {
      type: "SEND_OFF",
      title: "Grand send-off",
      description: "Guests line up for sparkler / petal send-off.",
      startOffset: 100 + receptionDurationHours * 60 - 5,
      durationMins: 15,
    },
  ]

  const entries = templates.map((t, i) => {
    const start = addMins(ceremonyTime, t.startOffset)
    const end = t.durationMins > 0 ? addMins(ceremonyTime, t.startOffset + t.durationMins) : undefined
    return {
      weddingId,
      type: t.type as any,
      title: t.title,
      description: t.description,
      startTime: start,
      endTime: end,
      isVendorAlert: t.isVendorAlert ?? false,
      order: i,
    }
  })

  await prisma.timelineEntry.createMany({ data: entries })

  const created = await prisma.timelineEntry.findMany({
    where: { weddingId },
    orderBy: { order: "asc" },
  })

  return NextResponse.json(created)
}

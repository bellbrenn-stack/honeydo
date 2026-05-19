import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { name, email, password, partnerName, weddingName } = await req.json()

  if (!name || !email || !password || !weddingName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: weddingName },
    })

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        hashedPassword,
        role: "COUPLE",
      },
    })

    const wedding = await tx.wedding.create({
      data: {
        tenantId: tenant.id,
        name: weddingName,
      },
    })

    await tx.weddingMember.create({
      data: { weddingId: wedding.id, userId: user.id, role: "COUPLE" },
    })

    // Seed default checklist items
    await tx.checklistItem.createMany({
      data: DEFAULT_CHECKLIST.map((item, i) => ({
        weddingId: wedding.id,
        ...item,
        order: i,
      })),
    })

    // Create partner user if name provided
    if (partnerName) {
      const partner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: partnerName,
          email: `partner+${Date.now()}@honeydo.local`,
          hashedPassword: await bcrypt.hash(Math.random().toString(36), 12),
          role: "COUPLE",
        },
      })
      await tx.weddingMember.create({
        data: { weddingId: wedding.id, userId: partner.id, role: "COUPLE" },
      })
    }
  })

  return NextResponse.json({ ok: true })
}

const DEFAULT_CHECKLIST = [
  { title: "Set your wedding date", category: "LOGISTICS" as const, dueOffsetDays: -540 },
  { title: "Set your budget", category: "LOGISTICS" as const, dueOffsetDays: -540 },
  { title: "Create your guest list", category: "LOGISTICS" as const, dueOffsetDays: -480 },
  { title: "Book your venue", category: "VENUE" as const, dueOffsetDays: -480 },
  { title: "Hire a photographer", category: "PHOTOGRAPHY" as const, dueOffsetDays: -420 },
  { title: "Hire a videographer", category: "VIDEOGRAPHY" as const, dueOffsetDays: -420 },
  { title: "Book your caterer", category: "CATERING" as const, dueOffsetDays: -360 },
  { title: "Book your florist", category: "FLORALS" as const, dueOffsetDays: -360 },
  { title: "Book your DJ or band", category: "MUSIC" as const, dueOffsetDays: -360 },
  { title: "Order wedding dress / attire", category: "ATTIRE" as const, dueOffsetDays: -300 },
  { title: "Send save-the-dates", category: "STATIONERY" as const, dueOffsetDays: -270 },
  { title: "Book your officiant", category: "OFFICIANT" as const, dueOffsetDays: -270 },
  { title: "Plan your honeymoon", category: "HONEYMOON" as const, dueOffsetDays: -240 },
  { title: "Book hair & makeup", category: "BEAUTY" as const, dueOffsetDays: -210 },
  { title: "Send wedding invitations", category: "STATIONERY" as const, dueOffsetDays: -180 },
  { title: "Book transportation", category: "TRANSPORTATION" as const, dueOffsetDays: -120 },
  { title: "Finalize ceremony outline", category: "CEREMONY" as const, dueOffsetDays: -60 },
  { title: "Confirm all vendors", category: "LOGISTICS" as const, dueOffsetDays: -30 },
  { title: "Get marriage license", category: "LEGAL" as const, dueOffsetDays: -30 },
  { title: "Final dress fitting", category: "ATTIRE" as const, dueOffsetDays: -14 },
  { title: "Steam/press all attire", category: "ATTIRE" as const, dueOffsetDays: -3 },
  { title: "Print vows", category: "CEREMONY" as const, dueOffsetDays: -2 },
  { title: "Prepare gratuity envelopes", category: "LOGISTICS" as const, dueOffsetDays: -2 },
  { title: "Pack emergency kit", category: "LOGISTICS" as const, dueOffsetDays: -1 },
]

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.string().default("OTHER"),
  startTime: z.string().min(1),
  endTime: z.string().optional(),
  description: z.string().optional(),
  isVendorAlert: z.boolean().default(false),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding" }, { status: 400 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const count = await prisma.timelineEntry.count({ where: { weddingId } })

  const entry = await prisma.timelineEntry.create({
    data: {
      weddingId,
      ...parsed.data,
      type: parsed.data.type as any,
      order: count,
    },
  })

  return NextResponse.json(entry)
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isVendorAlert: z.boolean().optional(),
})

async function getEntry(id: string, weddingId: string) {
  return prisma.timelineEntry.findFirst({ where: { id, weddingId } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding" }, { status: 400 })

  const { id } = await params
  const existing = await getEntry(id, weddingId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { type, ...rest } = parsed.data

  const entry = await prisma.timelineEntry.update({
    where: { id },
    data: { ...rest, ...(type && { type: type as any }) },
  })

  return NextResponse.json(entry)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding" }, { status: 400 })

  const { id } = await params
  const existing = await getEntry(id, weddingId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.timelineEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

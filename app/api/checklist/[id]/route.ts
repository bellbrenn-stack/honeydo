import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
})

async function getItem(id: string, weddingId: string) {
  return prisma.checklistItem.findFirst({ where: { id, weddingId } })
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
  const existing = await getItem(id, weddingId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { status, title, description, dueDate } = parsed.data

  const item = await prisma.checklistItem.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  })

  return NextResponse.json(item)
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
  const existing = await getItem(id, weddingId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!existing.isCustom) return NextResponse.json({ error: "Cannot delete default items" }, { status: 403 })

  await prisma.checklistItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

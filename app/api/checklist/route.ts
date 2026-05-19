import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().default("OTHER"),
  dueDate: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding found" }, { status: 400 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { title, category, dueDate, description } = parsed.data

  const count = await prisma.checklistItem.count({ where: { weddingId } })

  const item = await prisma.checklistItem.create({
    data: {
      weddingId,
      title,
      category: category as any,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isCustom: true,
      order: count,
    },
  })

  return NextResponse.json(item)
}

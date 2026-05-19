import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).nullable().optional(),
  depositAmount: z.number().min(0).nullable().optional(),
  depositDueDate: z.string().nullable().optional(),
  balanceDueDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["UNPAID", "DEPOSIT_PAID", "PAID_IN_FULL"]).optional(),
  notes: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
})

async function getItem(id: string, weddingId: string) {
  return prisma.budgetItem.findFirst({ where: { id, weddingId } })
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

  const { depositDueDate, balanceDueDate, category, ...rest } = parsed.data

  const item = await prisma.budgetItem.update({
    where: { id },
    data: {
      ...rest,
      ...(category && { category: category as any }),
      ...(depositDueDate !== undefined && {
        depositDueDate: depositDueDate ? new Date(depositDueDate) : null,
      }),
      ...(balanceDueDate !== undefined && {
        balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null,
      }),
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

  await prisma.budgetItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().default("OTHER"),
  estimatedCost: z.number().min(0).default(0),
  actualCost: z.number().min(0).nullable().optional(),
  depositAmount: z.number().min(0).nullable().optional(),
  depositDueDate: z.string().nullable().optional(),
  balanceDueDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["UNPAID", "DEPOSIT_PAID", "PAID_IN_FULL"]).default("UNPAID"),
  notes: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding found" }, { status: 400 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { depositDueDate, balanceDueDate, ...rest } = parsed.data

  const item = await prisma.budgetItem.create({
    data: {
      ...rest,
      weddingId,
      category: rest.category as any,
      depositDueDate: depositDueDate ? new Date(depositDueDate) : undefined,
      balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : undefined,
    },
  })

  return NextResponse.json(item)
}

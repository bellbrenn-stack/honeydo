import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  budget: z.number().min(0).optional(),
  weddingDate: z.string().nullable().optional(),
  guestCount: z.number().int().min(0).nullable().optional(),
  venue: z.string().nullable().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) return NextResponse.json({ error: "No wedding" }, { status: 400 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { weddingDate, ...rest } = parsed.data

  const wedding = await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      ...rest,
      ...(weddingDate !== undefined && {
        weddingDate: weddingDate ? new Date(weddingDate) : null,
      }),
    },
  })

  return NextResponse.json(wedding)
}

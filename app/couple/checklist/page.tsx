import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ChecklistView } from "@/components/checklist-view"

export default async function ChecklistPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) redirect("/onboarding")

  const [wedding, items] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.checklistItem.findMany({
      where: { weddingId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ])

  if (!wedding) redirect("/login")

  return <ChecklistView wedding={wedding} initialItems={items} />
}

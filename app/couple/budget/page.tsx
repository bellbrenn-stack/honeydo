import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BudgetView } from "@/components/budget-view"

export default async function BudgetPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) redirect("/onboarding")

  const [wedding, items, vendors] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.budgetItem.findMany({
      where: { weddingId },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    }),
    prisma.vendor.findMany({
      where: { weddingId },
      orderBy: { name: "asc" },
    }),
  ])

  if (!wedding) redirect("/login")

  return <BudgetView wedding={wedding} initialItems={items} vendors={vendors} />
}

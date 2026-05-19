import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHome } from "@/components/dashboard-home"

export default async function CoupleDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) redirect("/onboarding")

  const [wedding, checklistItems, budgetItems, vendors] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.checklistItem.findMany({
      where: { weddingId },
      orderBy: { order: "asc" },
    }),
    prisma.budgetItem.findMany({ where: { weddingId } }),
    prisma.vendor.findMany({ where: { weddingId } }),
  ])

  if (!wedding) redirect("/login")

  return (
    <DashboardHome
      wedding={wedding}
      checklistItems={checklistItems}
      budgetItems={budgetItems}
      vendors={vendors}
    />
  )
}

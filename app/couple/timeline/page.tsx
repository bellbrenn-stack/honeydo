import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TimelineView } from "@/components/timeline-view"

export default async function TimelinePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const weddingId = (session.user as any).weddingId as string | null
  if (!weddingId) redirect("/onboarding")

  const [wedding, entries] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.timelineEntry.findMany({
      where: { weddingId },
      orderBy: { order: "asc" },
    }),
  ])

  if (!wedding) redirect("/login")

  return <TimelineView wedding={wedding} initialEntries={entries} />
}

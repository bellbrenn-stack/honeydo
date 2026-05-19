import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function RootPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const role = (session.user as any)?.role
  if (role === "PLANNER") redirect("/planner")
  if (role === "VENDOR") redirect("/vendor")
  redirect("/couple")
}

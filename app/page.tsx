import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"

export default async function RootPage() {
  const session = await auth()

  if (session) {
    const role = (session.user as any)?.role
    if (role === "PLANNER") redirect("/planner")
    if (role === "VENDOR") redirect("/vendor")
    redirect("/couple")
  }

  return <LandingPage />
}

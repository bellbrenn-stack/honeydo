"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        partnerName: fd.get("partnerName"),
        weddingName: fd.get("weddingName"),
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? "Registration failed")
      return
    }

    toast.success("Account created! Please sign in.")
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #FAF3EE 50%, #F0E8DF 100%)" }}>
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="flex items-center gap-2.5 text-primary">
              <Heart className="h-7 w-7 fill-primary" />
              <span className="text-3xl font-bold tracking-tight">HoneyDo</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Start planning your wedding</CardTitle>
            <CardDescription>Create your free account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" placeholder="Alex" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerName">Partner&apos;s name</Label>
              <Input id="partnerName" name="partnerName" placeholder="Jordan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weddingName">Wedding name</Label>
              <Input id="weddingName" name="weddingName" placeholder="Alex & Jordan's Wedding" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Get started"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

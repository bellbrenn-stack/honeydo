"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      toast.error("Something went wrong. Please try again.")
      return
    }

    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #FAF3EE 50%, #F0E8DF 100%)" }}
    >
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center text-3xl" aria-hidden>🐝</div>
          {sent ? (
            <>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We sent a reset link to <strong>{email}</strong>.
                It expires in 1 hour.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl">Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a link to reset it.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {sent ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-center text-muted-foreground">
                Didn&apos;t get it? Check your spam folder, or{" "}
                <button
                  className="underline underline-offset-4 text-foreground"
                  onClick={() => setSent(false)}
                >
                  try again
                </button>
                .
              </p>
              <Button
                render={<Link href="/login" />}
                className="w-full rounded-full"
                style={{ background: "#8DB870", color: "#fff" }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full"
                style={{ background: "#8DB870", color: "#fff" }}
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

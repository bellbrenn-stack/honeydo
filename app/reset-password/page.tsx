"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Suspense } from "react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          This reset link is invalid or has already been used.
        </p>
        <Button render={<Link href="/forgot-password" />} variant="outline">
          Request a new link
        </Button>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords don't match")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong")
        return
      }

      setDone(true)
      setTimeout(() => router.push("/login"), 2500)
    })
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-3xl" aria-hidden>✅</div>
        <p className="font-medium">Password updated!</p>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            placeholder="At least 8 characters"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type={showPw ? "text" : "password"}
          placeholder="Repeat your password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm && confirm !== password && (
          <p className="text-xs text-destructive">Passwords don&apos;t match</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        style={{ background: "#8DB870", color: "#fff" }}
        disabled={isPending || (!!confirm && confirm !== password)}
      >
        {isPending ? "Updating…" : "Set new password"}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #FAF3EE 50%, #F0E8DF 100%)" }}
    >
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="text-3xl" aria-hidden>🔑</div>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>Choose something you&apos;ll remember — at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<p className="text-sm text-center text-muted-foreground">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
          <Link
            href="/login"
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

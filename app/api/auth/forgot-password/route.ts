import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  // Always return 200 — never reveal whether an email exists
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } })
  if (!user) return NextResponse.json({ ok: true })

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

  // Generate a secure random token, expires in 1 hour
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { email: user.email, token, expiresAt },
  })

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const resetUrl = `${base}/reset-password?token=${token}`

  await sendPasswordResetEmail(user.email, resetUrl)

  return NextResponse.json({ ok: true })
}

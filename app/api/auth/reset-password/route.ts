import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  if (!token || !password || typeof token !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { email: record.email } })
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { hashedPassword } }),
    prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
  ])

  return NextResponse.json({ ok: true })
}

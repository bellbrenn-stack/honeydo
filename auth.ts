import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"
import type { Role } from "@/lib/generated/prisma/enums"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            active: true,
          },
          include: {
            tenant: true,
            weddingAccess: { take: 1, orderBy: { weddingId: "asc" } },
          },
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          isAdmin: user.isAdmin,
          weddingId: user.weddingAccess[0]?.weddingId ?? null,
        }
      },
    }),
  ],
})

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  tenantId: string
  tenantName: string
  isAdmin: boolean
  weddingId: string | null
}

import type { NextAuthConfig } from "next-auth"

const ROLE_HOME: Record<string, string> = {
  COUPLE: "/couple",
  PLANNER: "/planner",
  VENDOR: "/vendor",
  FAMILY: "/couple",
}

const ROLE_PREFIXES: Record<string, string[]> = {
  COUPLE: ["/couple"],
  PLANNER: ["/planner", "/couple"],
  VENDOR: ["/vendor"],
  FAMILY: ["/couple"],
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname
      const isAuthPage = path === "/login" || path === "/register"
      const isAdminPath = path.startsWith("/admin")
      const isProtected =
        Object.values(ROLE_HOME).some((p) => path.startsWith(p)) || isAdminPath
      const role = (auth?.user as any)?.role as string | undefined
      const isAdmin = (auth?.user as any)?.isAdmin as boolean | undefined

      if (!auth && isProtected) return Response.redirect(new URL("/login", nextUrl))
      if (auth && isAuthPage)
        return Response.redirect(new URL(ROLE_HOME[role ?? ""] ?? "/couple", nextUrl))

      if (auth && isAdminPath) {
        if (isAdmin) return true
        return Response.redirect(new URL(ROLE_HOME[role ?? ""] ?? "/couple", nextUrl))
      }

      if (auth && isProtected && role) {
        const allowed = ROLE_PREFIXES[role] ?? []
        if (!allowed.some((p) => path.startsWith(p))) {
          return Response.redirect(new URL(ROLE_HOME[role] ?? "/couple", nextUrl))
        }
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.tenantName = (user as any).tenantName
        token.isAdmin = (user as any).isAdmin
        token.weddingId = (user as any).weddingId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).tenantName = token.tenantName
        ;(session.user as any).isAdmin = token.isAdmin
        ;(session.user as any).weddingId = token.weddingId
      }
      return session
    },
  },
}

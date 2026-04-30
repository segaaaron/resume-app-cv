import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

interface UserPlanCacheEntry {
  plan: string
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  role: string
  expiresAt: number
}

const userPlanCache = new Map<string, UserPlanCacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null
        if (user.deletedAt !== null) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Invalidate cache on new login so stale data is never used
        if (user.id) userPlanCache.delete(user.id)
      }
      const userId = (token.id ?? user?.id) as string | undefined
      if (userId) {
        const cached = userPlanCache.get(userId)
        if (cached && cached.expiresAt > Date.now()) {
          token.plan = cached.plan
          token.subscriptionStatus = cached.subscriptionStatus
          token.subscriptionEndsAt = cached.subscriptionEndsAt?.toISOString() ?? null
          token.role = cached.role
        } else {
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, deletedAt: true },
          })
          if (dbUser) {
            if (dbUser.deletedAt !== null) return null
            userPlanCache.set(userId, {
              plan: dbUser.plan,
              subscriptionStatus: dbUser.subscriptionStatus,
              subscriptionEndsAt: dbUser.subscriptionEndsAt,
              role: dbUser.role,
              expiresAt: Date.now() + CACHE_TTL_MS,
            })
            token.plan = dbUser.plan
            token.subscriptionStatus = dbUser.subscriptionStatus
            token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString() ?? null
            token.role = dbUser.role
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.subscriptionStatus = token.subscriptionStatus as string | undefined
        session.user.subscriptionEndsAt = token.subscriptionEndsAt as string | null | undefined
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
})

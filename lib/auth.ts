import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const CACHE_TTL_MS        = 5 * 60 * 1000        // 5 minutes
const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000  // 24 hours

interface UserPlanCacheEntry {
  plan:               string
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  role:               string
  emailVerified:      Date | null
  sessionVersion:     number
  expiresAt:          number
}

const userPlanCache = new Map<string, UserPlanCacheEntry>()

export function purgeUserCache(userId: string) {
  userPlanCache.delete(userId)
}

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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        if (user.id) userPlanCache.delete(user.id)
      }
      if (trigger === "update") {
        const uid = token.id as string | undefined
        if (uid) userPlanCache.delete(uid)
      }

      const userId = (token.id ?? user?.id) as string | undefined
      if (!userId) return token

      const now = Date.now()
      const cached = userPlanCache.get(userId)

      if (cached && cached.expiresAt > now) {
        token.plan               = cached.plan
        token.subscriptionStatus = cached.subscriptionStatus
        token.subscriptionEndsAt = cached.subscriptionEndsAt?.toISOString() ?? null
        token.role               = cached.role
        token.emailVerified      = cached.emailVerified?.toISOString() ?? null
        return token
      }

      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          plan:               true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          role:               true,
          deletedAt:          true,
          emailVerified:      true,
          sessionVersion:     true,
          lastActiveAt:       true,
        },
      })

      if (!dbUser)          return null
      if (dbUser.deletedAt) return null

      // 24h inactivity check
      if (now - dbUser.lastActiveAt.getTime() > INACTIVITY_LIMIT_MS) return null

      // sessionVersion invalidation — tokens minted before this feature have no version (undefined → 0)
      const tokenVersion = (token.sessionVersion as number | undefined) ?? 0
      if (tokenVersion !== 0 && tokenVersion !== dbUser.sessionVersion) return null
      // stamp current version into token (handles first-run for pre-feature tokens)
      token.sessionVersion = dbUser.sessionVersion

      userPlanCache.set(userId, {
        plan:               dbUser.plan,
        subscriptionStatus: dbUser.subscriptionStatus,
        subscriptionEndsAt: dbUser.subscriptionEndsAt,
        role:               dbUser.role,
        emailVerified:      dbUser.emailVerified,
        sessionVersion:     dbUser.sessionVersion,
        expiresAt:          now + CACHE_TTL_MS,
      })

      token.plan               = dbUser.plan
      token.subscriptionStatus = dbUser.subscriptionStatus
      token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString() ?? null
      token.role               = dbUser.role
      token.emailVerified      = dbUser.emailVerified?.toISOString() ?? null

      // fire-and-forget lastActiveAt update (runs at most every 5 min per user)
      db.user.update({
        where: { id: userId },
        data:  { lastActiveAt: new Date() },
      }).catch(() => {})

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id                 = token.id as string
        session.user.plan               = token.plan as string
        session.user.subscriptionStatus = token.subscriptionStatus as string | undefined
        session.user.subscriptionEndsAt = token.subscriptionEndsAt as string | null | undefined
        session.user.role               = token.role as string | undefined
        session.user.emailVerified      = (token.emailVerified ?? null) as unknown as (Date & string) | null
      }
      return session
    },
  },
})

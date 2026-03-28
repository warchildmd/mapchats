import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })

          if (!res.ok) return null

          const data = await res.json()
          return {
            id: data.user.id,
            name: data.user.displayName,
            email: data.user.email,
            image: data.user.avatar,
            username: data.user.username,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }
        } catch {
          return null
        }
      },
    }),
    Google({
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),
    GitHub,
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, store tokens + expiry
      if (user) {
        token.id = user.id as string
        token.username = (user as any).username
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        // Backend issues 15-minute access tokens; refresh 60 s early
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000
      }
      // For OAuth providers, exchange for backend token
      if (account && account.provider !== 'credentials') {
        try {
          const res = await fetch(`${API_BASE}/auth/oauth/callback/${account.provider}`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            token.id = data.user?.id
            token.username = data.user?.username
            token.accessToken = data.accessToken
            token.refreshToken = data.refreshToken
            token.accessTokenExpires = Date.now() + 14 * 60 * 1000
          }
        } catch {
          // OAuth handled via redirect flow — token may be set via URL params
        }
      }

      // Return token as-is if the access token hasn't expired yet
      if (Date.now() < ((token.accessTokenExpires as number) ?? 0)) {
        return token
      }

      // Access token expired — attempt silent refresh
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        })
        if (!res.ok) throw new Error('Refresh failed')
        const data = await res.json()
        return {
          ...token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken, // rotated
          accessTokenExpires: Date.now() + 14 * 60 * 1000,
          error: undefined,
        }
      } catch {
        // Refresh failed — force sign-out on next session check
        return { ...token, error: 'RefreshAccessTokenError' as const }
      }
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      ;(session.user as any).username = token.username
      ;(session.user as any).accessToken = token.accessToken
      ;(session.user as any).error = (token as any).error
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username: string
      accessToken: string
      error?: 'RefreshAccessTokenError'
    }
  }
}

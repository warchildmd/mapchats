import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { config } from '../config.js'

const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

/** Usernames that should be auto-elevated to ADMIN on first login/register */
function getAdminUsernames(): Set<string> {
  return new Set(
    config.ADMIN_USERNAMES.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
}

/** Elevate user to ADMIN if their username is in ADMIN_USERNAMES and they aren't already */
async function maybeElevateToAdmin(fastify: FastifyInstance, userId: string, username: string) {
  const admins = getAdminUsernames()
  if (admins.has(username.toLowerCase())) {
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    })
    return 'ADMIN' as const
  }
  return null
}

async function issueTokens(
  fastify: FastifyInstance,
  userId: string,
  username: string,
  role: 'USER' | 'MODERATOR' | 'ADMIN'
) {
  const accessToken = fastify.jwt.sign({ sub: userId, username, role })

  const refreshToken = crypto.randomBytes(40).toString('hex')
  await fastify.redis.set(
    `refresh:${refreshToken}`,
    userId,
    'EX',
    REFRESH_TTL_SECONDS
  )

  return { accessToken, refreshToken }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { email, username, password, displayName } = body.data

    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      return reply.code(409).send({ error: 'Email or username already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    let user = await fastify.prisma.user.create({
      data: { email, username, passwordHash, displayName },
    })

    // Auto-elevate if username is in ADMIN_USERNAMES
    const elevated = await maybeElevateToAdmin(fastify, user.id, user.username)
    if (elevated) user = { ...user, role: elevated }

    const tokens = await issueTokens(fastify, user.id, user.username, user.role)
    return reply.code(201).send({ user: sanitizeUser(user), ...tokens })
  })

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { email, password } = body.data

    let user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' })

    // Auto-elevate if username was added to ADMIN_USERNAMES after initial registration
    if (user.role === 'USER') {
      const elevated = await maybeElevateToAdmin(fastify, user.id, user.username)
      if (elevated) user = { ...user, role: elevated }
    }

    const tokens = await issueTokens(fastify, user.id, user.username, user.role)
    return reply.send({ user: sanitizeUser(user), ...tokens })
  })

  // Refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = (request.body as any) ?? {}
    if (!refreshToken) return reply.code(400).send({ error: 'refreshToken required' })

    const userId = await fastify.redis.get(`refresh:${refreshToken}`)
    if (!userId) return reply.code(401).send({ error: 'Invalid or expired refresh token' })

    const user = await fastify.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(401).send({ error: 'User not found' })

    // Rotate refresh token
    await fastify.redis.del(`refresh:${refreshToken}`)
    const tokens = await issueTokens(fastify, user.id, user.username, user.role)
    return reply.send(tokens)
  })

  // Logout
  fastify.post(
    '/auth/logout',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { refreshToken } = (request.body as any) ?? {}
      if (refreshToken) {
        await fastify.redis.del(`refresh:${refreshToken}`)
      }
      return reply.send({ ok: true })
    }
  )

  // OAuth — Google redirect
  fastify.get('/auth/oauth/google', async (_request, reply) => {
    if (!config.GOOGLE_CLIENT_ID) return reply.code(501).send({ error: 'Google OAuth not configured' })

    const state = crypto.randomBytes(16).toString('hex')
    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: `${config.FRONTEND_URL.replace('3000', '4000')}/auth/oauth/callback/google`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    })
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  // OAuth — GitHub redirect
  fastify.get('/auth/oauth/github', async (_request, reply) => {
    if (!config.GITHUB_CLIENT_ID) return reply.code(501).send({ error: 'GitHub OAuth not configured' })

    const state = crypto.randomBytes(16).toString('hex')
    const params = new URLSearchParams({
      client_id: config.GITHUB_CLIENT_ID,
      redirect_uri: `${config.FRONTEND_URL.replace('3000', '4000')}/auth/oauth/callback/github`,
      scope: 'read:user user:email',
      state,
    })
    return reply.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // OAuth — Google callback
  fastify.get('/auth/oauth/callback/google', async (request, reply) => {
    const { code } = request.query as { code: string }
    if (!code) return reply.code(400).send({ error: 'Missing code' })

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID!,
        client_secret: config.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${config.FRONTEND_URL.replace('3000', '4000')}/auth/oauth/callback/google`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json() as any
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json() as any

    const user = await upsertOAuthUser(fastify, {
      provider: 'google',
      providerAccountId: profile.id,
      email: profile.email,
      displayName: profile.name,
      avatar: profile.picture,
    })

    const tokens = await issueTokens(fastify, user.id, user.username, user.role)
    const params = new URLSearchParams(tokens)
    return reply.redirect(`${config.FRONTEND_URL}/auth/callback?${params}`)
  })

  // OAuth — GitHub callback
  fastify.get('/auth/oauth/callback/github', async (request, reply) => {
    const { code } = request.query as { code: string }
    if (!code) return reply.code(400).send({ error: 'Missing code' })

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json() as any

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json() as any

    // GitHub may not expose email publicly — fetch separately
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const emails = await emailRes.json() as any[]
    const primaryEmail = emails.find((e: any) => e.primary)?.email ?? `${profile.login}@github.noreply`

    const user = await upsertOAuthUser(fastify, {
      provider: 'github',
      providerAccountId: String(profile.id),
      email: primaryEmail,
      displayName: profile.name ?? profile.login,
      avatar: profile.avatar_url,
    })

    const tokens = await issueTokens(fastify, user.id, user.username, user.role)
    const params = new URLSearchParams(tokens)
    return reply.redirect(`${config.FRONTEND_URL}/auth/callback?${params}`)
  })
}

async function upsertOAuthUser(
  fastify: FastifyInstance,
  data: { provider: string; providerAccountId: string; email: string; displayName: string; avatar?: string }
) {
  const existing = await fastify.prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: data.provider, providerAccountId: data.providerAccountId } },
    include: { user: true },
  })

  if (existing) return existing.user

  // Check if email already in use (link account)
  let user = await fastify.prisma.user.findUnique({ where: { email: data.email } })
  if (!user) {
    const base = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 25)
    const username = `${base}_${crypto.randomBytes(3).toString('hex')}`
    user = await fastify.prisma.user.create({
      data: {
        email: data.email,
        username,
        displayName: data.displayName,
        avatar: data.avatar,
      },
    })
  }

  await fastify.prisma.account.create({
    data: {
      userId: user.id,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
    },
  })

  return user
}

function sanitizeUser(user: any) {
  const { passwordHash: _, ...safe } = user
  return safe
}

export default authRoutes

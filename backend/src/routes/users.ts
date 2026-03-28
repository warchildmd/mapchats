import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { levelForKarma } from '../services/karma.service.js'

const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 5000, 15000, 50000]

const RANK_NAMES: Record<number, string> = {
  1: 'Newcomer',
  2: 'Explorer',
  3: 'Contributor',
  4: 'Map Guru',
  5: 'Master Cartographer',
  6: 'Legend',
  7: 'Electric Cartographer',
}

function reputationInfo(karma: number) {
  const level = levelForKarma(karma)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const percentToNextLevel =
    level >= LEVEL_THRESHOLDS.length
      ? 100
      : Math.min(100, Math.round(((karma - currentThreshold) / (nextThreshold - currentThreshold)) * 100))

  return {
    level,
    rank: RANK_NAMES[level] ?? 'Unknown',
    karma,
    percentToNextLevel,
    nextLevelThreshold: nextThreshold,
  }
}

const updateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
})

const roleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
})

const banSchema = z.object({
  banned: z.boolean(),
})

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/users/me
  fastify.get('/api/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true,
        _count: { select: { posts: true, comments: true } },
      },
    })
    if (!user) return reply.code(404).send({ error: 'User not found' })

    const { passwordHash: _, ...safe } = user
    return { ...safe, reputation: reputationInfo(user.karma) }
  })

  // PATCH /api/users/me
  fastify.patch('/api/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub
    const body = updateSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: body.data,
    })
    const { passwordHash: _, ...safe } = user
    return safe
  })

  // PATCH /api/users/:username/role — admin only
  fastify.patch(
    '/api/users/:username/role',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { username } = request.params as { username: string }
      const adminUsername = (request as any).user.username

      if (username === adminUsername) {
        return reply.code(400).send({ error: 'You cannot change your own role' })
      }

      const body = roleSchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const user = await fastify.prisma.user.findUnique({ where: { username } })
      if (!user) return reply.code(404).send({ error: 'User not found' })

      const updated = await fastify.prisma.user.update({
        where: { username },
        data: { role: body.data.role },
      })
      const { passwordHash: _, ...safe } = updated
      return safe
    }
  )

  // PATCH /api/users/:username/ban — mod or admin
  fastify.patch(
    '/api/users/:username/ban',
    { preHandler: [fastify.requireMod] },
    async (request, reply) => {
      const { username } = request.params as { username: string }
      const callerUsername = (request as any).user.username

      if (username === callerUsername) {
        return reply.code(400).send({ error: 'You cannot ban yourself' })
      }

      const body = banSchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const user = await fastify.prisma.user.findUnique({ where: { username } })
      if (!user) return reply.code(404).send({ error: 'User not found' })
      if (user.role === 'ADMIN') {
        return reply.code(403).send({ error: 'Cannot ban an admin' })
      }

      const updated = await fastify.prisma.user.update({
        where: { username },
        data: { banned: body.data.banned },
      })
      const { passwordHash: _, ...safe } = updated
      return safe
    }
  )

  // GET /api/users/:username — public profile
  fastify.get('/api/users/:username', async (request, reply) => {
    const { username } = request.params as { username: string }

    const user = await fastify.prisma.user.findUnique({
      where: { username },
      include: {
        badges: true,
        _count: { select: { posts: true, comments: true } },
      },
    })
    if (!user) return reply.code(404).send({ error: 'User not found' })

    const recentPosts = await fastify.prisma.post.findMany({
      where: { authorId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        category: true,
        title: true,
        lat: true,
        lng: true,
        locationName: true,
        createdAt: true,
        expiresAt: true,
        imageUrls: true,
        _count: { select: { votes: true } },
      },
    })

    const recentComments = await fastify.prisma.comment.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        post: { select: { id: true, title: true } },
        _count: { select: { votes: true } },
      },
    })

    const { passwordHash: _, ...safe } = user
    return {
      ...safe,
      reputation: reputationInfo(user.karma),
      recentPosts,
      recentComments,
    }
  })
}

export default usersRoutes

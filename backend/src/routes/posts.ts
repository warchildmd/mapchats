import { FastifyPluginAsync } from 'fastify'
import { Prisma } from '../generated/prisma/client'
import { z } from 'zod'
import {
  CATEGORY_LIFETIME,
  UPVOTE_EXTENSION_MINUTES,
} from '../config.js'
import {
  calcExpiryAfterUpvote,
} from '../services/post-expiry.service.js'
import { recalcKarma } from '../services/karma.service.js'

const PROXIMITY_KM = 1
const MAX_MAP_PINS = 300

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const createPostSchema = z.object({
  category: z.enum(['ALERT', 'DISCUSSION', 'EVENT']),
  title: z.string().min(3).max(120),
  content: z.string().min(1).max(1000),
  imageUrls: z.array(z.string().url()).max(4).default([]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(100).optional(),
  userLat: z.number().min(-90).max(90),
  userLng: z.number().min(-180).max(180),
  startTime: z.string().datetime().optional(),
})

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/posts/map — pins in bounding box
  fastify.get(
    '/api/posts/map',
    { preHandler: [fastify.optionalAuthenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, string>
      const sw_lat = parseFloat(query.sw_lat)
      const sw_lng = parseFloat(query.sw_lng)
      const ne_lat = parseFloat(query.ne_lat)
      const ne_lng = parseFloat(query.ne_lng)

      if ([sw_lat, sw_lng, ne_lat, ne_lng].some(isNaN)) {
        return reply.code(400).send({ error: 'sw_lat, sw_lng, ne_lat, ne_lng required' })
      }

      // Optional category filter — safe: validated against allowlist before Prisma.raw
      const VALID_CATEGORIES = ['ALERT', 'DISCUSSION', 'EVENT']
      const rawCategory = (query.category ?? '').toUpperCase()
      const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : null
      const categoryFilter = category
        ? Prisma.sql`AND p.category = ${Prisma.raw(`'${category}'::"Category"`)}`
        : Prisma.empty

      const posts = await fastify.prisma.$queryRaw<
        Array<{
          id: string
          category: string
          title: string
          lat: number
          lng: number
          expires_at: Date
          created_at: Date
          start_time: Date | null
          upvotes: bigint
          downvotes: bigint
          comment_count: bigint
          author_id: string
          author_username: string
          author_display_name: string
          author_avatar: string | null
        }>
      >`
        SELECT
          p.id,
          p.category,
          p.title,
          p.lat,
          p.lng,
          p."expiresAt" AS expires_at,
          p."createdAt" AS created_at,
          p."startTime" AS start_time,
          COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
          COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
          COUNT(DISTINCT c.id) AS comment_count,
          u.id AS author_id,
          u.username AS author_username,
          u."displayName" AS author_display_name,
          u.avatar AS author_avatar
        FROM "Post" p
        LEFT JOIN "Vote" v ON v."postId" = p.id
        LEFT JOIN "Comment" c ON c."postId" = p.id
        JOIN "User" u ON u.id = p."authorId"
        WHERE
          p."expiresAt" > NOW()
          AND (p."publishAt" IS NULL OR p."publishAt" <= NOW())
          AND p.lat BETWEEN ${sw_lat} AND ${ne_lat}
          AND p.lng BETWEEN ${sw_lng} AND ${ne_lng}
          ${categoryFilter}
        GROUP BY p.id, u.id
        ORDER BY (COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) + COUNT(DISTINCT c.id)) DESC
        LIMIT ${MAX_MAP_PINS}
      `

      return posts.map((p) => ({
        id: p.id,
        category: p.category,
        title: p.title,
        lat: p.lat,
        lng: p.lng,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        startTime: p.start_time,
        upvotes: Number(p.upvotes),
        downvotes: Number(p.downvotes),
        commentCount: Number(p.comment_count),
        engagementScore: Number(p.upvotes) - Number(p.downvotes) + Number(p.comment_count),
        author: {
          id: p.author_id,
          username: p.author_username,
          displayName: p.author_display_name,
          avatar: p.author_avatar,
        },
      }))
    }
  )

  // GET /api/posts/:id — full post detail
  fastify.get(
    '/api/posts/:id',
    { preHandler: [fastify.optionalAuthenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = (request as any).user?.sub

      const post = await fastify.prisma.post.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, karma: true, level: true } },
          votes: true,
          _count: { select: { comments: true } },
        },
      })

      if (!post || post.expiresAt < new Date() || (post.publishAt && post.publishAt > new Date())) {
        return reply.code(404).send({ error: 'Post not found' })
      }

      const upvotes = post.votes.filter((v) => v.value === 1).length
      const downvotes = post.votes.filter((v) => v.value === -1).length
      const userVote = userId ? (post.votes.find((v) => v.userId === userId)?.value ?? null) : null

      return {
        ...post,
        votes: undefined,
        upvotes,
        downvotes,
        commentCount: post._count.comments,
        userVote,
      }
    }
  )

  // POST /api/posts — create post
  fastify.post(
    '/api/posts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = createPostSchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const { category, title, content, imageUrls, lat, lng, locationName, userLat, userLng, startTime } =
        body.data

      // Banned users cannot post
      const userId = (request as any).user.sub
      const author = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { banned: true } })
      if (author?.banned) return reply.code(403).send({ error: 'Your account has been banned' })

      const distKm = haversineKm(userLat, userLng, lat, lng)
      if (distKm > PROXIMITY_KM) {
        return reply.code(403).send({
          error: `You must be within ${PROXIMITY_KM}km of the post location. You are ${distKm.toFixed(2)}km away.`,
        })
      }

      const now = new Date()
      const { baseMinutes } = CATEGORY_LIFETIME[category]
      const expiresAt = new Date(now.getTime() + baseMinutes * 60 * 1000)

      const post = await fastify.prisma.post.create({
        data: {
          authorId: userId,
          category: category as any,
          title,
          content,
          imageUrls,
          lat,
          lng,
          locationName,
          expiresAt,
          startTime: category === 'EVENT' && startTime ? new Date(startTime) : null,
        },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      })

      return reply.code(201).send({ ...post, upvotes: 0, downvotes: 0, commentCount: 0, userVote: null })
    }
  )

  // DELETE /api/posts/:id
  fastify.delete(
    '/api/posts/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = (request as any).user.sub

      const post = await fastify.prisma.post.findUnique({ where: { id } })
      if (!post) return reply.code(404).send({ error: 'Post not found' })

      const isMod = ['MODERATOR', 'ADMIN'].includes((request as any).user.role)
      if (post.authorId !== userId && !isMod) return reply.code(403).send({ error: 'Forbidden' })

      await fastify.prisma.post.delete({ where: { id } })
      return reply.send({ ok: true })
    }
  )

  // POST /api/posts/:id/vote
  fastify.post(
    '/api/posts/:id/vote',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = (request as any).user.sub
      const { value } = (request.body as any) ?? {}

      if (value !== 1 && value !== -1) {
        return reply.code(400).send({ error: 'value must be 1 or -1' })
      }

      const post = await fastify.prisma.post.findUnique({ where: { id } })
      if (!post || post.expiresAt < new Date()) {
        return reply.code(404).send({ error: 'Post not found' })
      }

      const existing = await fastify.prisma.vote.findUnique({
        where: { userId_postId: { userId, postId: id } },
      })

      if (existing) {
        if (existing.value === value) {
          // Undo vote
          await fastify.prisma.vote.delete({ where: { id: existing.id } })
        } else {
          await fastify.prisma.vote.update({ where: { id: existing.id }, data: { value } })
        }
      } else {
        await fastify.prisma.vote.create({ data: { userId, postId: id, value } })
      }

      // Extend post lifetime on upvote
      if (value === 1) {
        const { maxMinutes } = CATEGORY_LIFETIME[post.category as 'ALERT' | 'DISCUSSION' | 'EVENT']
        const newExpiry = calcExpiryAfterUpvote(
          post.expiresAt,
          post.createdAt,
          UPVOTE_EXTENSION_MINUTES,
          maxMinutes
        )
        if (newExpiry > post.expiresAt) {
          await fastify.prisma.post.update({ where: { id }, data: { expiresAt: newExpiry } })
        }
      }

      await recalcKarma(fastify.prisma, post.authorId)

      // Return updated counts
      const votes = await fastify.prisma.vote.findMany({ where: { postId: id } })
      const upvotes = votes.filter((v) => v.value === 1).length
      const downvotes = votes.filter((v) => v.value === -1).length
      const userVote = votes.find((v) => v.userId === userId)?.value ?? null

      return reply.send({ upvotes, downvotes, userVote })
    }
  )
}

export default postsRoutes

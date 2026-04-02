import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { CATEGORY_LIFETIME } from '../config.js'

const adminCreatePostSchema = z.object({
  category: z.enum(['ALERT', 'DISCUSSION', 'EVENT']),
  title: z.string().min(3).max(120),
  content: z.string().min(1).max(1000),
  imageUrls: z.array(z.string().url()).max(4).default([]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(100).optional(),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  startTime: z.string().datetime().optional(),
})

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/admin/posts — create post without proximity restrictions
  fastify.post(
    '/api/admin/posts',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const body = adminCreatePostSchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const { category, title, content, imageUrls, lat, lng, locationName, publishAt, expiresAt, startTime } =
        body.data

      const userId = (request as any).user.sub

      const { baseMinutes } = CATEGORY_LIFETIME[category]
      const visibleFrom = publishAt ? new Date(publishAt) : new Date()
      const resolvedExpiresAt = expiresAt
        ? new Date(expiresAt)
        : new Date(visibleFrom.getTime() + baseMinutes * 60 * 1000)

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
          publishAt: publishAt ? new Date(publishAt) : null,
          expiresAt: resolvedExpiresAt,
          startTime: category === 'EVENT' && startTime ? new Date(startTime) : null,
        },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      })

      return reply.code(201).send({ ...post, upvotes: 0, downvotes: 0, commentCount: 0, userVote: null })
    }
  )
}

export default adminRoutes

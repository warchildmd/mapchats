import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { MAX_LIFETIME_DAYS, COMMENT_EXTENSION_MINUTES } from '../config.js'
import { calcExpiryAfterComment } from '../services/post-expiry.service.js'
import { recalcKarma } from '../services/karma.service.js'

const commentBodySchema = z.object({
  content: z.string().min(1).max(2000),
})

const commentsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/posts/:id/comments — flat list, client builds tree
  fastify.get(
    '/api/posts/:id/comments',
    { preHandler: [fastify.optionalAuthenticate] },
    async (request, reply) => {
      const { id: postId } = request.params as { id: string }
      const userId = (request as any).user?.sub

      const comments = await fastify.prisma.comment.findMany({
        where: { postId },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          votes: true,
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'asc' },
      })

      return comments.map((c) => {
        const upvotes = c.votes.filter((v) => v.value === 1).length
        const downvotes = c.votes.filter((v) => v.value === -1).length
        const userVote = userId ? (c.votes.find((v) => v.userId === userId)?.value ?? null) : null
        return {
          id: c.id,
          postId: c.postId,
          parentCommentId: c.parentCommentId,
          content: c.content,
          createdAt: c.createdAt,
          author: c.author,
          upvotes,
          downvotes,
          replyCount: c._count.replies,
          userVote,
        }
      })
    }
  )

  // POST /api/posts/:id/comments — top-level comment
  fastify.post(
    '/api/posts/:id/comments',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: postId } = request.params as { id: string }
      const userId = (request as any).user.sub

      // Banned users cannot comment
      const commenter = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { banned: true } })
      if (commenter?.banned) return reply.code(403).send({ error: 'Your account has been banned' })

      const body = commentBodySchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const post = await fastify.prisma.post.findUnique({ where: { id: postId } })
      if (!post || post.expiresAt < new Date()) {
        return reply.code(404).send({ error: 'Post not found' })
      }

      const comment = await fastify.prisma.comment.create({
        data: { postId, authorId: userId, content: body.data.content },
        include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } },
      })

      // Extend post lifetime
      const newExpiry = calcExpiryAfterComment(
        post.expiresAt,
        post.createdAt,
        COMMENT_EXTENSION_MINUTES,
        MAX_LIFETIME_DAYS
      )
      if (newExpiry > post.expiresAt) {
        await fastify.prisma.post.update({ where: { id: postId }, data: { expiresAt: newExpiry } })
      }

      return reply.code(201).send({ ...comment, upvotes: 0, downvotes: 0, replyCount: 0, userVote: null })
    }
  )

  // POST /api/comments/:id/replies — nested reply
  fastify.post(
    '/api/comments/:id/replies',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: parentCommentId } = request.params as { id: string }
      const userId = (request as any).user.sub

      // Banned users cannot reply
      const commenter = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { banned: true } })
      if (commenter?.banned) return reply.code(403).send({ error: 'Your account has been banned' })

      const body = commentBodySchema.safeParse(request.body)
      if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

      const parent = await fastify.prisma.comment.findUnique({
        where: { id: parentCommentId },
        include: { post: true },
      })
      if (!parent) return reply.code(404).send({ error: 'Comment not found' })
      if (parent.post.expiresAt < new Date()) return reply.code(404).send({ error: 'Post expired' })

      const comment = await fastify.prisma.comment.create({
        data: {
          postId: parent.postId,
          authorId: userId,
          parentCommentId,
          content: body.data.content,
        },
        include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } },
      })

      // Extend post lifetime
      const newExpiry = calcExpiryAfterComment(
        parent.post.expiresAt,
        parent.post.createdAt,
        COMMENT_EXTENSION_MINUTES,
        MAX_LIFETIME_DAYS
      )
      if (newExpiry > parent.post.expiresAt) {
        await fastify.prisma.post.update({
          where: { id: parent.postId },
          data: { expiresAt: newExpiry },
        })
      }

      return reply.code(201).send({ ...comment, upvotes: 0, downvotes: 0, replyCount: 0, userVote: null })
    }
  )

  // DELETE /api/comments/:id — author or mod/admin
  fastify.delete(
    '/api/comments/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = (request as any).user.sub
      const userRole = (request as any).user.role

      const comment = await fastify.prisma.comment.findUnique({ where: { id } })
      if (!comment) return reply.code(404).send({ error: 'Comment not found' })

      const isMod = ['MODERATOR', 'ADMIN'].includes(userRole)
      if (comment.authorId !== userId && !isMod) {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      await fastify.prisma.comment.delete({ where: { id } })
      return reply.send({ ok: true })
    }
  )

  // POST /api/comments/:id/vote
  fastify.post(
    '/api/comments/:id/vote',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: commentId } = request.params as { id: string }
      const userId = (request as any).user.sub
      const { value } = (request.body as any) ?? {}

      if (value !== 1 && value !== -1) {
        return reply.code(400).send({ error: 'value must be 1 or -1' })
      }

      const comment = await fastify.prisma.comment.findUnique({ where: { id: commentId } })
      if (!comment) return reply.code(404).send({ error: 'Comment not found' })

      const existing = await fastify.prisma.vote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })

      if (existing) {
        if (existing.value === value) {
          await fastify.prisma.vote.delete({ where: { id: existing.id } })
        } else {
          await fastify.prisma.vote.update({ where: { id: existing.id }, data: { value } })
        }
      } else {
        await fastify.prisma.vote.create({ data: { userId, commentId, value } })
      }

      await recalcKarma(fastify.prisma, comment.authorId)

      const votes = await fastify.prisma.vote.findMany({ where: { commentId } })
      const upvotes = votes.filter((v) => v.value === 1).length
      const downvotes = votes.filter((v) => v.value === -1).length
      const userVote = votes.find((v) => v.userId === userId)?.value ?? null

      return reply.send({ upvotes, downvotes, userVote })
    }
  )
}

export default commentsRoutes

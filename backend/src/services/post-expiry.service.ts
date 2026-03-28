import { Worker, Queue } from 'bullmq'
import { PrismaClient } from '../generated/prisma/client'
import Redis from 'ioredis'
import { recalcKarma } from './karma.service.js'
import { config } from '../config.js'

const QUEUE_NAME = 'post-expiry'

/** BullMQ requires maxRetriesPerRequest: null — use a dedicated connection */
function makeBullConnection() {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }) as any
}

export async function startExpiryWorker(prisma: PrismaClient, _redis: unknown): Promise<Worker> {
  const queue = new Queue(QUEUE_NAME, { connection: makeBullConnection() })

  // Schedule repeatable cleanup job every 5 minutes
  await queue.add(
    'cleanup',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 min
      jobId: 'cleanup-repeatable',
    }
  )

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== 'cleanup') return

      // Find expired posts and collect their authorIds for karma recalc
      const expired = await prisma.post.findMany({
        where: { expiresAt: { lt: new Date() } },
        select: { id: true, authorId: true },
      })

      if (expired.length === 0) return

      const authorIds = [...new Set(expired.map((p) => p.authorId))]

      await prisma.post.deleteMany({
        where: { id: { in: expired.map((p) => p.id) } },
      })

      // Recalc karma for affected authors
      await Promise.allSettled(authorIds.map((id) => recalcKarma(prisma, id)))

      console.log(`[expiry-worker] Deleted ${expired.length} expired posts`)
    },
    { connection: makeBullConnection() }
  )

  worker.on('failed', (job, err) => {
    console.error(`[expiry-worker] Job ${job?.id} failed:`, err)
  })

  return worker
}

/**
 * Calculates new expiresAt after an upvote.
 * Extends by UPVOTE_EXTENSION_HOURS, capped at 7 days from creation.
 */
export function calcExpiryAfterUpvote(
  currentExpiresAt: Date,
  createdAt: Date,
  extensionHours: number,
  maxDays: number
): Date {
  const maxExpiry = new Date(createdAt.getTime() + maxDays * 24 * 60 * 60 * 1000)
  const extended = new Date(Date.now() + extensionHours * 60 * 60 * 1000)
  const candidate = extended < maxExpiry ? extended : maxExpiry
  return candidate > currentExpiresAt ? candidate : currentExpiresAt
}

/**
 * Calculates new expiresAt after a comment.
 * Extends current expiry by COMMENT_EXTENSION_MINUTES, capped at 7 days from creation.
 */
export function calcExpiryAfterComment(
  currentExpiresAt: Date,
  createdAt: Date,
  extensionMinutes: number,
  maxDays: number
): Date {
  const maxExpiry = new Date(createdAt.getTime() + maxDays * 24 * 60 * 60 * 1000)
  const extended = new Date(currentExpiresAt.getTime() + extensionMinutes * 60 * 1000)
  return extended < maxExpiry ? extended : maxExpiry
}

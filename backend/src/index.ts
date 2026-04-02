import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'path'

import { config } from './config.js'
import redisPlugin from './plugins/redis.js'
import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'
import multipartPlugin from './plugins/multipart.js'

import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import commentsRoutes from './routes/comments.js'
import usersRoutes from './routes/users.js'
import uploadsRoutes from './routes/uploads.js'
import geoRoutes from './routes/geo.js'

import { startExpiryWorker } from './services/post-expiry.service.js'

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
    transport:
      config.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

async function main() {
  // Infrastructure plugins
  await fastify.register(corsPlugin)
  await fastify.register(redisPlugin)
  await fastify.register(prismaPlugin)
  await fastify.register(authPlugin)
  await fastify.register(multipartPlugin)

  // Serve uploaded files
  await fastify.register(fastifyStatic, {
    root: path.resolve(config.UPLOAD_DIR),
    prefix: '/uploads/',
  })

  // Routes
  await fastify.register(authRoutes)
  await fastify.register(postsRoutes)
  await fastify.register(commentsRoutes)
  await fastify.register(usersRoutes)
  await fastify.register(uploadsRoutes)
  await fastify.register(geoRoutes)

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' })

    // Start BullMQ expiry worker after server is ready
    await startExpiryWorker(fastify.prisma, fastify.redis)
    fastify.log.info('Post expiry worker started')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()

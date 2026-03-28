import { FastifyPluginAsync } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { config } from '../config.js'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  // Ensure upload directory exists
  await fs.mkdir(config.UPLOAD_DIR, { recursive: true })

  // GET /api/uploads/config — public flag so the frontend can conditionally show upload UI
  fastify.get('/api/uploads/config', async (_request, reply) => {
    return reply.send({ enabled: config.ENABLE_UPLOADS })
  })

  // POST /api/uploads — multipart image upload
  fastify.post(
    '/api/uploads',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!config.ENABLE_UPLOADS) {
        return reply.code(403).send({ error: 'Image uploads are disabled' })
      }

      const urls: string[] = []

      const parts = request.files()
      for await (const part of parts) {
        if (!ALLOWED_MIME_TYPES.includes(part.mimetype)) {
          return reply.code(400).send({ error: `Unsupported MIME type: ${part.mimetype}` })
        }

        const ext = part.mimetype.split('/')[1].replace('jpeg', 'jpg')
        const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`
        const filepath = path.join(config.UPLOAD_DIR, filename)

        const chunks: Buffer[] = []
        for await (const chunk of part.file) {
          chunks.push(chunk as Buffer)
        }
        const buffer = Buffer.concat(chunks)
        await fs.writeFile(filepath, buffer)

        // Return a path that will be served by the static plugin
        urls.push(`/uploads/${filename}`)
      }

      return reply.send({ urls })
    }
  )
}

export default uploadsRoutes

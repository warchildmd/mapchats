import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyMultipart from '@fastify/multipart'

const multipartPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 4,
    },
  })
}

export default fp(multipartPlugin, { name: 'multipart' })

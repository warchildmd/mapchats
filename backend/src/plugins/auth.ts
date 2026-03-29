import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { config } from '../config.js'
import { JwtPayload } from '../types/index.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireMod: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '15m' },
  })

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch {
        reply.code(401).send({ error: 'Unauthorized' })
      }
    }
  )

  fastify.decorate(
    'optionalAuthenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch {
        // no-op: user is simply unauthenticated
      }
    }
  )

  // Requires MODERATOR or ADMIN role
  fastify.decorate(
    'requireMod',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
        if (!['MODERATOR', 'ADMIN'].includes(request.user.role)) {
          return reply.code(403).send({ error: 'Moderator access required' })
        }
      } catch {
        reply.code(401).send({ error: 'Unauthorized' })
      }
    }
  )

  // Requires ADMIN role
  fastify.decorate(
    'requireAdmin',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
        if (request.user.role !== 'ADMIN') {
          return reply.code(403).send({ error: 'Admin access required' })
        }
      } catch {
        reply.code(401).send({ error: 'Unauthorized' })
      }
    }
  )
}

export default fp(authPlugin, { name: 'auth' })

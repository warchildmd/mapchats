import { FastifyPluginAsync } from 'fastify'
import geoip from 'geoip-lite'

const geoRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/geo/ip — return approximate lat/lng for the caller's IP
  fastify.get('/api/geo/ip', async (request, reply) => {
    // Prefer x-forwarded-for (set by reverse proxies) over the raw socket IP
    const forwarded = request.headers['x-forwarded-for']
    const rawIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0].trim()) ||
      request.ip

    // Normalise IPv6-mapped IPv4 addresses (e.g. "::ffff:1.2.3.4")
    const ip = rawIp.replace(/^::ffff:/, '')

    const geo = geoip.lookup(ip)

    if (!geo) {
      // Private / loopback / unknown IP — return nulls so the client keeps its default view
      return reply.send({ lat: null, lng: null })
    }

    return reply.send({ lat: geo.ll[0], lng: geo.ll[1] })
  })
}

export default geoRoutes

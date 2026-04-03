import { FastifyPluginAsync } from 'fastify'
import { isIP } from 'node:net'
import geoip from 'geoip-lite'

function normalizeIp(raw: string) {
  const trimmed = raw.trim()

  if (!trimmed) return null

  const withoutIpv6Prefix = trimmed.replace(/^::ffff:/, '')
  const withoutBrackets =
    withoutIpv6Prefix.startsWith('[') && withoutIpv6Prefix.endsWith(']')
      ? withoutIpv6Prefix.slice(1, -1)
      : withoutIpv6Prefix

  return isIP(withoutBrackets) ? withoutBrackets : null
}

function isPrivateOrReservedIp(ip: string) {
  if (ip === '::1' || ip === '::' || ip === '0.0.0.0') return true

  if (ip.includes(':')) {
    const lower = ip.toLowerCase()
    return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')
  }

  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true

  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  )
}

const geoRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/geo/ip — return approximate lat/lng for the caller's IP
  fastify.get('/api/geo/ip', async (request, reply) => {
    const candidates = [
      request.headers['cf-connecting-ip'],
      request.headers['x-real-ip'],
      request.headers['x-forwarded-for'],
      request.ip,
    ]

    const ip =
      candidates
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .flatMap((value) => typeof value === 'string' ? value.split(',') : [])
        .map(normalizeIp)
        .find((value): value is string => value !== null && !isPrivateOrReservedIp(value)) ??
      normalizeIp(request.ip)

    if (!ip || isPrivateOrReservedIp(ip)) {
      // Private / loopback / unknown IP — return nulls so the client keeps its default view
      return reply.send({ lat: null, lng: null })
    }

    const geo = geoip.lookup(ip)

    if (!geo) {
      // Private / loopback / unknown IP — return nulls so the client keeps its default view
      return reply.send({ lat: null, lng: null })
    }

    return reply.send({ lat: geo.ll[0], lng: geo.ll[1] })
  })
}

export default geoRoutes

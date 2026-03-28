import { FastifyRequest } from 'fastify'

export interface JwtPayload {
  sub: string // userId
  username: string
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload
}

export interface MapBounds {
  sw_lat: number
  sw_lng: number
  ne_lat: number
  ne_lng: number
}

export interface PostWithCounts {
  id: string
  authorId: string
  category: string
  title: string
  content: string
  imageUrls: string[]
  lat: number
  lng: number
  locationName: string | null
  expiresAt: Date
  createdAt: Date
  author: {
    id: string
    username: string
    displayName: string
    avatar: string | null
  }
  upvotes: number
  downvotes: number
  commentCount: number
  userVote: number | null
}

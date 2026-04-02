import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  UPLOAD_DIR: z.string().default('./uploads'),
  ENABLE_UPLOADS: z.coerce.boolean().default(true),
  ADMIN_USERNAMES: z.string().default(''),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data

export const CATEGORY_LIFETIME: Record<'ALERT' | 'DISCUSSION' | 'EVENT', { baseMinutes: number; maxMinutes: number }> = {
  ALERT:      { baseMinutes: 60,   maxMinutes: 3 * 24 * 60 },   // 1h base, 3d max
  DISCUSSION: { baseMinutes: 720,  maxMinutes: 7 * 24 * 60 },   // 12h base, 7d max
  EVENT:      { baseMinutes: 1440, maxMinutes: 7 * 24 * 60 },   // 24h base, 7d max
}
export const UPVOTE_EXTENSION_MINUTES = 60
export const COMMENT_EXTENSION_MINUTES = 30

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeoPost — a location-based social platform where users pin posts to GPS coordinates on a map. Posts have a 24-hour base lifetime extended by engagement (+1h per upvote, +30min per comment, max 7 days). Three categories: Alert, Discussion, Event.

## Architecture

Two independent TypeScript projects orchestrated via Docker Compose:

- **Backend** (`backend/`): Fastify 5 + Prisma + PostgreSQL/PostGIS + Redis + BullMQ
- **Frontend** (`frontend/`): Next.js 16 (App Router) + React 19 + MapLibre GL + NextAuth 5 + TanStack Query

No shared workspace — each has its own `package.json`, `tsconfig`, and Dockerfile.

## Development Commands

### Start all services (Postgres, Redis, backend, frontend with hot reload):
```bash
docker-compose -f docker-compose.dev.yml up
```
Backend: http://localhost:4000 | Frontend: http://localhost:3000

### Backend (`cd backend`):
```bash
npm run dev              # tsx watch src/index.ts
npm run build            # tsc → dist/
npm start                # node dist/index.js
npm run prisma:migrate   # apply migrations
npm run prisma:generate  # regenerate client after schema changes
npm run prisma:studio    # database GUI
```

### Frontend (`cd frontend`):
```bash
npm run dev              # next dev (proxies /api/* to backend)
npm run build            # next build
npm run lint             # next lint (ESLint)
```

### Production build:
```bash
docker-compose build && docker-compose up
```

## Key Architecture Details

**Auth flow**: Backend issues JWT access tokens (7 days) + Redis-stored refresh tokens (30 days, rotated). Frontend NextAuth handles silent refresh in its `jwt()` callback. `SessionGuard` component auto-signs-out on refresh failure.

**Role elevation**: `ADMIN_USERNAMES` env var (comma-separated) auto-promotes matching users to ADMIN on login/register. Roles: USER → MODERATOR → ADMIN.

**Auth middleware** (`backend/src/plugins/auth.ts`): Decorates Fastify with `authenticate()`, `optionalAuthenticate()`, `requireMod()`, `requireAdmin()`.

**Spatial queries**: Posts fetched by map viewport bounds. PostGIS handles geo indexing. Frontend clusters pins at zoom ≤14, shows individual markers at zoom >14.

**Post expiry**: BullMQ worker (`services/post-expiry.service.ts`) runs every 5 minutes to delete expired posts.

**API client**: `frontend/src/lib/api.ts` is the typed fetch wrapper — all backend calls go through it.

**Design tokens** (in `globals.css`): Dark theme, primary `#97a9ff`, secondary `#ffbf00`, tertiary `#ac8aff`, surface `#0e0e10`. Category gradients: `bg-alert-gradient`, `bg-kinetic-gradient`, `bg-event-gradient`.

**Image uploads**: Feature-gated behind `ENABLE_UPLOADS` env var. Served from `/app/uploads` Docker volume.

**Frontend dev proxy**: `next.config.ts` rewrites `/api/*` to `NEXT_PUBLIC_API_URL` in development only.

## Database

Prisma schema at `backend/prisma/schema.prisma`. Core models: User, Post, Comment, Vote, Badge, Account. Migrations are in `backend/prisma/migrations/`.

## Environment

Copy `.env.example` to `.env`. Required vars: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`. OAuth vars (`GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`) are optional.

Backend validates all config via Zod on startup (`backend/src/config.ts`) — exits immediately if vars are missing.

## No Automated Tests

No test framework is configured. Testing has been manual (documented in `TESTING.md`).

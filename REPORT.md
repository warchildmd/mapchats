# GeoPost — Repository Report

> **Date:** 2026-03-29  
> **Repository:** `warchildmd/mapchats`  
> **Stack:** Fastify 5 · Next.js 16 · PostgreSQL/PostGIS · Redis · Docker

---

## Table of Contents

1. [Features](#1-features)
2. [Configuration Values](#2-configuration-values)
3. [Deploying on Dokploy](#3-deploying-on-dokploy)
4. [Potential Bugs](#4-potential-bugs-5)

---

## 1. Features

### Core Platform

| Feature | Description |
|---------|-------------|
| **Map-centric feed** | Posts are pinned to GPS coordinates and rendered on a MapLibre GL map. Users discover content by panning/zooming instead of scrolling a timeline. |
| **Proximity posting** | A user must be within ~1 km of the target location to create a post (Haversine distance check on the frontend). |
| **Post lifetime & decay** | Every post starts with a 24-hour lifetime. Upvotes extend it by +1 hour; comments extend it by +30 minutes. Maximum lifetime is capped at 7 days. |
| **Three categories** | **Alert** (urgent/safety), **Discussion** (general conversation), **Event** (time-bound happenings). Each category has a distinct color gradient on the map. |
| **Spatial queries** | The backend uses PostGIS to fetch posts within the visible map viewport (bounding-box query), ensuring only relevant pins are loaded. |
| **Pin clustering** | At zoom ≤14 pins are clustered; at zoom >14 individual markers are shown, preventing visual overload. |

### Social & Engagement

| Feature | Description |
|---------|-------------|
| **Nested comments** | Comments support one level of replies (parent → child). |
| **Voting** | Users can upvote (+1) or downvote (−1) both posts and comments. Vote values update karma. |
| **Karma & reputation** | A user's karma is recalculated periodically by a background worker. Karma influences displayed level/reputation. |
| **Badges** | A `Badge` model exists for gamification awards (icon + name + awarded date). |
| **User profiles** | Public profiles show username, display name, avatar, karma, level, and badges. |

### Authentication & Authorization

| Feature | Description |
|---------|-------------|
| **Credential auth** | Register/login with email + password (bcrypt hashed). |
| **OAuth** | Google and GitHub sign-in via NextAuth 5 on the frontend; the backend exchanges OAuth codes for its own JWT tokens. |
| **JWT access + refresh tokens** | Access tokens expire in 15 minutes. Refresh tokens are stored in Redis with a 30-day TTL and rotated on each use. |
| **Silent token refresh** | NextAuth `jwt()` callback silently refreshes the access token before it expires; `SessionGuard` component signs the user out on refresh failure. |
| **Role-based access** | Three roles: `USER`, `MODERATOR`, `ADMIN`. Middleware helpers: `authenticate`, `optionalAuthenticate`, `requireMod`, `requireAdmin`. |
| **Admin auto-promotion** | The `ADMIN_USERNAMES` env var (comma-separated) auto-promotes matching users to `ADMIN` on register/login. |
| **Moderation tools** | Moderators/admins can delete any post or comment, change user roles, and ban users. |

### Infrastructure

| Feature | Description |
|---------|-------------|
| **Docker Compose** | Production and development compose files. Multi-stage Dockerfiles for both backend and frontend. |
| **Background workers** | BullMQ + Redis worker runs every 5 minutes to delete expired posts and recalculate karma for affected authors. |
| **Image uploads** | Feature-gated behind `ENABLE_UPLOADS`. Files are saved to a Docker volume and served as static assets. |
| **Health check** | `GET /health` endpoint returns `{ status: 'ok' }`. |
| **Zod config validation** | Backend validates all environment variables on startup via a Zod schema and exits immediately on misconfiguration. |

---

## 2. Configuration Values

### Environment Variables (`.env`)

All variables are defined in `.env.example` and consumed by `docker-compose.yml`.

#### Required Secrets

| Variable | Where | Purpose |
|----------|-------|---------|
| `POSTGRES_PASSWORD` | Backend / Postgres | Database password |
| `REDIS_PASSWORD` | Backend / Redis | Redis `requirepass` |
| `JWT_SECRET` | Backend | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Backend | Signs refresh tokens (min 32 chars) |
| `NEXTAUTH_SECRET` | Frontend | NextAuth session encryption |
| `AUTH_SECRET` | Frontend | Alias used by NextAuth v5 internally |

#### OAuth (Optional)

| Variable | Where | Purpose |
|----------|-------|---------|
| `GOOGLE_CLIENT_ID` | Both | Google OAuth app ID |
| `GOOGLE_CLIENT_SECRET` | Both | Google OAuth app secret |
| `GITHUB_CLIENT_ID` | Both | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | Both | GitHub OAuth app secret |

#### URLs & Networking

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Public URL the browser uses for API calls |
| `NEXT_PUBLIC_BACKEND_INTERNAL_URL` | `http://backend:4000` | Internal Docker-network URL for server-side calls |
| `FRONTEND_URL` | `http://localhost:3000` | Backend CORS origin |
| `NEXTAUTH_URL` | `http://localhost:3000` | NextAuth canonical URL |

#### Feature Flags & Tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_UPLOADS` | `true` | Enable/disable image upload endpoints |
| `UPLOAD_DIR` | `./uploads` (dev) / `/app/uploads` (prod) | File storage path |
| `ADMIN_USERNAMES` | `""` (empty) | Comma-separated usernames auto-promoted to ADMIN |
| `PORT` | `4000` | Backend listen port |
| `NODE_ENV` | `development` | Environment mode |

### Application Constants (`backend/src/config.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `BASE_LIFETIME_HOURS` | `24` | Default post lifetime |
| `MAX_LIFETIME_DAYS` | `7` | Hard cap on post lifetime |
| `UPVOTE_EXTENSION_HOURS` | `1` | Hours added per upvote |
| `COMMENT_EXTENSION_MINUTES` | `30` | Minutes added per comment |

### Docker Compose Services

| Service | Image | Ports | Volumes |
|---------|-------|-------|---------|
| `postgres` | `postgis/postgis:16-3.4` | — | `pgdata` |
| `redis` | `redis:7-alpine` | — | `redisdata` |
| `backend` | Built from `./backend/Dockerfile` | `4000:4000` | `uploads` |
| `frontend` | Built from `./frontend/Dockerfile` | `3000:3000` | — |

---

## 3. Deploying on Dokploy

[Dokploy](https://dokploy.com) is a self-hosted PaaS built on Docker and Traefik. Below is a step-by-step guide to deploy GeoPost on a Dokploy server.

### Prerequisites

- A Linux VPS (Ubuntu 22.04+ recommended, 2 GB+ RAM)
- A domain name with DNS A records pointed to the server IP (e.g. `geopost.example.com` for the frontend, `api.geopost.example.com` for the backend)
- Dokploy installed on the server:
  ```bash
  curl -sSL https://dokploy.com/install.sh | sudo sh
  ```

### Step 1 — Prepare a Dokploy-compatible Compose File

Create a `docker-compose.dokploy.yml` based on the existing production `docker-compose.yml` with these key changes:

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: geopost
      POSTGRES_USER: geopost
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - dokploy-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U geopost"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    networks:
      - dokploy-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://geopost:${POSTGRES_PASSWORD}@postgres:5432/geopost
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      FRONTEND_URL: https://geopost.example.com
      PORT: 4000
      NODE_ENV: production
      UPLOAD_DIR: /app/uploads
      ENABLE_UPLOADS: ${ENABLE_UPLOADS:-true}
      ADMIN_USERNAMES: ${ADMIN_USERNAMES:-}
    volumes:
      - uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dokploy-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.geopost-api.rule=Host(`api.geopost.example.com`)"
      - "traefik.http.routers.geopost-api.entrypoints=websecure"
      - "traefik.http.routers.geopost-api.tls.certResolver=letsencrypt"
      - "traefik.http.services.geopost-api.loadbalancer.server.port=4000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXTAUTH_URL: https://geopost.example.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_TRUST_HOST: "true"
      NEXT_PUBLIC_API_URL: https://api.geopost.example.com
      NEXT_PUBLIC_BACKEND_INTERNAL_URL: http://backend:4000
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
    depends_on:
      - backend
    networks:
      - dokploy-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.geopost-web.rule=Host(`geopost.example.com`)"
      - "traefik.http.routers.geopost-web.entrypoints=websecure"
      - "traefik.http.routers.geopost-web.tls.certResolver=letsencrypt"
      - "traefik.http.services.geopost-web.loadbalancer.server.port=3000"

networks:
  dokploy-network:
    external: true

volumes:
  pgdata:
  redisdata:
  uploads:
```

**Key differences from the standard compose file:**

1. **Network** — All services join `dokploy-network` (Dokploy's external Traefik network)
2. **Traefik labels** — Added to `backend` and `frontend` for automatic HTTPS routing via Let's Encrypt
3. **No exposed ports** — Removed `ports:` mappings; Traefik handles ingress
4. **Production URLs** — `FRONTEND_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` use real domain names

### Step 2 — Create the Compose Application in Dokploy

1. Open the Dokploy dashboard at `https://dokploy.example.com`
2. Navigate to **Projects** → **Create Project** → name it `geopost`
3. Inside the project, click **Create Service** → **Compose**
4. Choose source:
   - **Git**: Connect to `https://github.com/warchildmd/mapchats` and set the compose path to `docker-compose.dokploy.yml`
   - **Raw**: Or paste the Dokploy compose YAML directly in the editor

### Step 3 — Set Environment Variables

In the Dokploy service **Environment** tab, add all required variables:

```
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
JWT_SECRET=<random-string-min-32-chars>
JWT_REFRESH_SECRET=<random-string-min-32-chars>
NEXTAUTH_SECRET=<random-string-min-32-chars>
AUTH_SECRET=<same-as-NEXTAUTH_SECRET>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
GITHUB_CLIENT_ID=<optional>
GITHUB_CLIENT_SECRET=<optional>
ENABLE_UPLOADS=true
ADMIN_USERNAMES=your-admin-username
```

> **Tip:** Generate secrets with `openssl rand -base64 48`.

### Step 4 — Configure Domains

In the Dokploy **Domains** tab:

| Service | Domain | Port |
|---------|--------|------|
| frontend | `geopost.example.com` | 3000 |
| backend | `api.geopost.example.com` | 4000 |

Enable **HTTPS** with Let's Encrypt for both. Dokploy will auto-configure Traefik routing.

### Step 5 — Deploy

1. Click **Deploy** in the Dokploy dashboard
2. Monitor the build logs in real-time (Docker multi-stage builds will run for both services)
3. Wait for the PostgreSQL and Redis health checks to pass
4. The Prisma migration runs automatically on backend startup (`npx prisma migrate deploy`)
5. Once complete, visit `https://geopost.example.com`

### Step 6 — Post-deployment Checklist

- [ ] Verify `https://api.geopost.example.com/health` returns `{ "status": "ok" }`
- [ ] Register a user and confirm it appears in the database
- [ ] Verify map loads and geolocation works (requires HTTPS)
- [ ] If using OAuth, ensure callback URLs in Google/GitHub console match:
  - Google: `https://geopost.example.com/api/auth/callback/google`
  - GitHub: `https://geopost.example.com/api/auth/callback/github`
- [ ] Check that the expiry worker is running (`docker logs <backend-container>` should show periodic cleanup)
- [ ] Confirm uploads work if `ENABLE_UPLOADS=true`

### Updating the Deployment

Dokploy supports auto-deploy via Git webhooks. Alternatively, click **Redeploy** in the dashboard after pushing changes. Persistent data (PostgreSQL, Redis, uploads) is preserved across deploys via named Docker volumes.

---

## 4. Potential Bugs (5)

### Bug 1 — `calcExpiryAfterUpvote` extends from current time instead of current expiry

**File:** `backend/src/services/post-expiry.service.ts` **Line 75**  
**Severity:** High — Business logic error

```typescript
// Current code (line 75):
const extended = new Date(Date.now() + extensionHours * 60 * 60 * 1000)

// Should be (consistent with calcExpiryAfterComment on line 91):
const extended = new Date(currentExpiresAt.getTime() + extensionHours * 60 * 60 * 1000)
```

**Problem:** The upvote extension is calculated from `Date.now()` instead of from the post's `currentExpiresAt`. This means if a post has 20 hours remaining and gets an upvote, the "extension" could actually *shorten* its life to just 1 hour from now. The sister function `calcExpiryAfterComment` correctly extends from `currentExpiresAt`. The guard on line 77 (`candidate > currentExpiresAt`) partially mitigates this, but it means upvotes on posts with more remaining time than the extension period have **zero effect**, contrary to the intended behavior of always adding time.

---

### Bug 2 — Proximity distance check always evaluates to zero

**File:** `frontend/src/app/create/page.tsx` **Line 51**  
**Severity:** High — Feature bypass

```typescript
// Current code:
const distanceKm =
  geo.granted ? haversineKm(geo.lat!, geo.lng!, geo.lat!, geo.lng!) : null
```

**Problem:** The Haversine function computes distance between two points, but both points are the user's own GPS coordinates (`geo.lat, geo.lng` twice). This always returns 0 km. The proximity check on line 52 sets `withinRange = geo.granted`, which means anyone with geolocation permission can post anywhere. Since posts are always pinned to the user's current location, the distance check is effectively dead code. If the design ever allows placing a pin at a different location, this bug would silently allow it without any proximity enforcement.

---

### Bug 3 — Auth middleware does not `return` after sending 403 responses

**File:** `backend/src/plugins/auth.ts` **Lines 57–59, 72–74**  
**Severity:** High — Authorization bypass risk

```typescript
// requireMod (line 57-59):
if (!['MODERATOR', 'ADMIN'].includes(request.user.role)) {
  reply.code(403).send({ error: 'Moderator access required' })
  // ← no return — execution continues to route handler
}

// requireAdmin (line 72-74):
if (request.user.role !== 'ADMIN') {
  reply.code(403).send({ error: 'Admin access required' })
  // ← no return — execution continues to route handler
}
```

**Problem:** After sending the 403 response, execution is not halted. In Fastify, `preHandler` hooks must either `return` or `throw` to stop the request lifecycle. Without an explicit `return`, the route handler still executes, meaning a regular `USER` could perform moderator/admin actions. The response body sent to the client would be the 403 error (first `reply.send()` wins), but the **side effects** of the route handler (database writes, deletions, role changes) would still occur.

---

### Bug 4 — Image upload is permanently disabled by a hardcoded `false`

**File:** `frontend/src/app/create/page.tsx` **Line 191**  
**Severity:** Medium — Dead feature

```typescript
{false && uploadsEnabled && (
  <div>
    <input ref={fileInputRef} type="file" ... />
    ...
  </div>
)}
```

**Problem:** The JSX expression starts with `false &&`, which short-circuits the entire block regardless of the `uploadsEnabled` flag from the backend. The image upload feature — including the file input, preview grid, and upload button — is never rendered. This was likely added as a temporary disable during development but was never reverted. The backend upload endpoints and config still work; only the frontend UI is suppressed.

---

### Bug 5 — Moderators can ban other moderators (missing privilege-level check)

**File:** `backend/src/routes/users.ts` **Lines 106–134**  
**Severity:** Medium — Privilege escalation

```typescript
// The endpoint uses requireMod (allows MODERATOR or ADMIN)
fastify.patch('/api/users/:username/ban',
  { preHandler: [fastify.requireMod] },
  async (request, reply) => {
    // ...
    if (user.role === 'ADMIN') {
      return reply.code(403).send({ error: 'Cannot ban an admin' })
    }
    // No check for: user.role === 'MODERATOR' && caller.role === 'MODERATOR'
    await fastify.prisma.user.update({ where: { username }, data: { banned } })
  }
)
```

**Problem:** The endpoint only prevents banning ADMINs. A user with the `MODERATOR` role can ban another `MODERATOR`, which is a horizontal privilege escalation. In a well-designed moderation system, peers at the same level should not be able to disable each other's accounts — only a higher-ranked role (ADMIN) should be able to ban a moderator. A rogue or compromised moderator account could disable all other moderators.

---

*End of report.*

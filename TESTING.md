# GeoPost — QA Test Plan & Bug Log

## Test Flows

### 1. Map View (/)
- [x] Map renders with dark tiles
- [x] Filter chips visible (All / Alerts / Discussions / Events)
- [x] Bottom nav visible (Map, Alerts, Post, Activity, Profile)
- [x] FAB (+) button visible (SVG icon — no text, normal)
- [x] No console errors

### 2. Auth — Register
- [x] Navigate to /login
- [x] Switch to Sign Up tab
- [x] Fill display name, username, email, password
- [x] Submit → redirects to /
- [x] User is logged in

### 3. Auth — Login
- [x] Navigate to /login
- [x] Fill email + password
- [x] Submit → redirects to /

### 4. Create Post (/create)
- [x] FAB navigates to /create
- [x] Category selector works (Alert / Discussion / Event)
- [x] Title + content inputs work
- [x] Proximity indicator shows "Location verified — within posting range"
- [x] Publish button enabled when location granted + form filled
- [x] Post created → redirects to /post/:id

### 5. Post Detail (/post/:id)
- [x] Post title, content, author visible
- [x] Expiry timer shows ("23h left")
- [x] Vote buttons work (API confirmed; UI buttons at correct DOM indices)
- [x] Comments section renders
- [x] Comment input works
- [x] Reply to comment works (reply count increments)

### 6. Map pins
- [x] Post exists in DB at correct coordinates (API confirmed)
- [x] Pin visible on map after geolocation flies to user location (zoom 15)
- [x] Clicking pin shows PostCard preview sheet (title, expiry, author, vote/comment counts)
- [x] Clicking PostCard navigates to /post/:id

### 7. Profile (/profile/:username)
- [x] Karma (1) + rank (Newcomer) displayed
- [x] Reputation progress bar visible (1% to Level 2)
- [x] Recent posts listed
- [x] Recent Activity (comments) listed

---

## Bugs Found

### BUG-001 — Register form crashes on backend validation error (FIXED)
**Severity**: Critical
**File**: `frontend/src/app/login/page.tsx`
**Symptom**: Submitting register with empty/invalid fields shows "Network error" instead of field errors.
**Root cause**: Backend Zod validation returns `{ error: { formErrors, fieldErrors } }` (object), but the frontend did `setError(data.error)` which sets an object as React state and crashes the render.
**Fix**: Parse error: if string use directly, if `fieldErrors` flatten to first message, else fallback to "Registration failed".
**Status**: FIXED

### BUG-002 — Map hardcoded to New York City initial view (FIXED)
**Severity**: High
**File**: `frontend/src/components/map/MapView.tsx`
**Symptom**: Map always opens centered on NYC (lat 40.7128, lng -74.006, zoom 12). Posts created in other locations (e.g., Bucharest) don't appear because the bounding box query only covers NYC.
**Root cause**: `initialViewState` hardcoded; no geolocation used for initial center.
**Fix**: Accept `initialCenter` prop in MapView; in HomePage use `useGeolocation` to pass user's location. Default to world view (zoom 2) while geolocation resolves.
**Status**: FIXED

### BUG-003 — Map double-renders pins (cluster circles + individual markers overlap) (FIXED)
**Severity**: Medium
**File**: `frontend/src/components/map/MapView.tsx`
**Symptom**: Individual `<Marker>` components always render for all pins, even when they are inside cluster circles. At low zoom levels, pins stack on top of cluster circles causing visual overlap.
**Root cause**: The `unclustered` filter always returns `true`; markers are never filtered by zoom.
**Fix**: Track map zoom; only render individual `<Marker>` components when zoom > `clusterMaxZoom` (14).
**Status**: FIXED

### BUG-004 — NextAuth UntrustedHost error (FIXED)
**Severity**: Critical
**File**: `frontend/src/lib/auth.ts`, `docker-compose.yml`, `.env`
**Symptom**: All `/api/auth/*` routes returned 400 UntrustedHost; login/register/session completely broken.
**Root cause**: Missing `trustHost: true` in NextAuth config; `AUTH_SECRET` env var not set (NextAuth v5 renamed from `NEXTAUTH_SECRET`).
**Fix**: Added `trustHost: true` to NextAuth config, added `AUTH_SECRET` + `AUTH_TRUST_HOST=true` to docker-compose, added `AUTH_SECRET` to `.env`.
**Status**: FIXED

### BUG-005 — Access token expires silently causing "Unauthorized" errors (FIXED)
**Severity**: High
**File**: `frontend/src/lib/auth.ts`, `frontend/src/app/providers.tsx`
**Symptom**: After 15 minutes the JWT access token expires. Subsequent API calls (create post, comment, vote) return 401 Unauthorized, but there is no prompt to re-authenticate.
**Root cause**: The NextAuth `jwt` callback stored the access token but never checked its expiry or called the backend `/auth/refresh` endpoint.
**Fix**:
- Track `accessTokenExpires` (now + 14 min) in the NextAuth JWT payload on sign-in.
- On every subsequent `jwt` callback call, check `Date.now() < accessTokenExpires`. If the token is still valid return it as-is.
- If expired, call `POST /auth/refresh` with the stored `refreshToken`. On success, update `accessToken`, `refreshToken` (rotated), and `accessTokenExpires`.
- On refresh failure, set `error: 'RefreshAccessTokenError'` in the token.
- Added `SessionGuard` component in `providers.tsx` that watches `session.user.error` and calls `signOut()` if refresh failed, forcing re-login.
**Status**: FIXED

### BUG-006 — No logout button in the UI (FIXED)
**Severity**: Medium
**Files**: `frontend/src/components/auth/LogoutButton.tsx` (new), `frontend/src/app/profile/[username]/page.tsx`
**Symptom**: Users had no way to sign out without clearing browser storage.
**Fix**: Created `LogoutButton` client component (calls `signOut({ callbackUrl: '/login' })`). Placed in the Profile page header, replacing the static "Profile" label.
**Status**: FIXED

### BUG-007 — Image uploads not behind a feature flag (FIXED)
**Severity**: Low
**Files**: `backend/src/config.ts`, `backend/src/routes/uploads.ts`, `frontend/src/app/create/page.tsx`, `.env`, `docker-compose.yml`
**Symptom**: Image upload functionality was always enabled with no way to disable it via config.
**Fix**:
- Added `ENABLE_UPLOADS: z.coerce.boolean().default(true)` to backend `config.ts`.
- `POST /api/uploads` returns `403` immediately if `config.ENABLE_UPLOADS` is `false`.
- Added `GET /api/uploads/config` public endpoint returning `{ enabled: boolean }`.
- Added `NEXT_PUBLIC_ENABLE_UPLOADS` env var; frontend `create/page.tsx` hides the image upload section when `NEXT_PUBLIC_ENABLE_UPLOADS=false`.
- Both vars default to `true` in `.env` and `docker-compose.yml`.
**Status**: FIXED

---

## Fixes Applied

| Bug | File | Status |
|-----|------|--------|
| BUG-001 Register Zod error crash | `frontend/src/app/login/page.tsx` | ✅ FIXED |
| BUG-002 Map hardcoded to NYC | `frontend/src/components/map/MapView.tsx` | ✅ FIXED — `useGeolocation` + `flyTo(zoom:15)` + `mapLoaded` gate |
| BUG-003 Map cluster overlap | `frontend/src/components/map/MapView.tsx` | ✅ FIXED — markers only shown when `zoom > 14` |
| BUG-004 NextAuth UntrustedHost | `frontend/src/lib/auth.ts`, `docker-compose.yml`, `.env` | ✅ FIXED |
| BUG-005 Access token expiry / silent 401 | `frontend/src/lib/auth.ts`, `providers.tsx` | ✅ FIXED — silent refresh in `jwt` callback + `SessionGuard` |
| BUG-006 No logout button | `LogoutButton.tsx`, `profile/[username]/page.tsx` | ✅ FIXED |
| BUG-007 Image uploads not behind flag | `backend/config.ts`, `uploads.ts`, `create/page.tsx`, `.env` | ✅ FIXED |

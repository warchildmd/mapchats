# Admin API: Inserting Data

## `POST /api/admin/posts`

Creates a post anywhere on the map, bypassing the normal proximity restriction that requires you to be near the location.

**Requirements:** Must be authenticated as an ADMIN user (username listed in `ADMIN_USERNAMES` env var).

---

### Request

```
POST https://geopostapi.burduja.me/api/admin/posts
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `category` | `"ALERT" \| "DISCUSSION" \| "EVENT"` | yes | Post type |
| `title` | string (3–120 chars) | yes | Post title |
| `content` | string (1–1000 chars) | yes | Post body |
| `lat` | number (-90 to 90) | yes | Latitude |
| `lng` | number (-180 to 180) | yes | Longitude |
| `locationName` | string (max 100) | no | Human-readable location label |
| `imageUrls` | string[] (max 4 URLs) | no | Image URLs (default: `[]`) |
| `publishAt` | ISO 8601 datetime | no | Schedule future visibility (default: now) |
| `expiresAt` | ISO 8601 datetime | no | Override expiry (default: now + category lifetime) |
| `startTime` | ISO 8601 datetime | no | Event start time (only used when `category == "EVENT"`) |

---

### Example

```bash
curl -X POST https://geopostapi.burduja.me/api/admin/posts \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "EVENT",
    "title": "Street Festival",
    "content": "Annual street festival downtown.",
    "lat": 48.8566,
    "lng": 2.3522,
    "locationName": "Paris, France",
    "startTime": "2026-04-05T14:00:00.000Z"
  }'
```

**Response:** `201` with the full post object (`upvotes: 0`, `downvotes: 0`, `commentCount: 0`, `userVote: null`).

---

### Getting your JWT token

After logging in via the frontend, grab the token from the NextAuth session in the browser, or hit `POST /api/auth/login` directly with your credentials.

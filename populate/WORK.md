# Task: Scrape & Publish Bucharest Events to GeoPost

## Implemented process (scripts)

### Files
- `populate/extract-events.js`
- `populate/publish-events.js`

### 1. Load credentials
- Read `populate/.env`.
- Required key: `ADMIN_TOKEN`.

### 2. Extract events from Zile și Nopți
Run:
```bash
node populate/extract-events.js "https://zilesinopti.ro/evenimente-bucuresti/?zi=YYYY-MM-DD"
```

Output is a JSON array with:
```json
{
  "title": "...",
  "location": "...",
  "description": "...",
  "date_time": "Vineri 03/04 20:00",
  "link": "https://zilesinopti.ro/evenimente/..."
}
```

Extractor behavior:
- Uses only raw JS (no external libs).
- Parses `kzn-sw-item` cards.
- Extracts title/link, location, optional description, date/time.
- If card has only time and no day/date, falls back to page date from `?zi=YYYY-MM-DD`.
- Deduplicates by `link + date_time`.

### 3. Geocode unique locations
For each unique location:
```text
https://nominatim.openstreetmap.org/search?q={LOCATION},%20București&format=json&limit=1&countrycodes=ro
```

- Use first result `lat/lon`.
- If empty/failure: fallback to Bucharest center:
  - `lat=44.4268`
  - `lng=26.1025`

### 4. Parse dates and compute publish times
For each event `date_time`:
- Strip Romanian weekday prefix (`Luni`, `Marți`, `Miercuri`, `Joi`, `Vineri`, `Sâmbătă`, `Duminică`).
- Parse `DD/MM HH:MM`.
- Year rule: current year, unless parsed date is more than 60 days in the past, then use next year.
- Convert Bucharest local (EEST) to UTC by subtracting 3 hours.
- Compute:
  - `startTime` = UTC event start
  - `publishAt` = `startTime - 12h`

### 5. Publish to admin API
Endpoint:
```text
POST https://geopostapi.burduja.me/api/admin/posts
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

Payload:
```json
{
  "category": "EVENT",
  "title": "<max 120 chars>",
  "content": "<description or title; max 1000 chars>",
  "lat": 44.4355973,
  "lng": 26.0969873,
  "locationName": "<max 100 chars>",
  "publishAt": "2026-04-03T05:00:00.000Z",
  "startTime": "2026-04-03T17:00:00.000Z"
}
```

Success condition: HTTP `201`.

### 6. One-command run (extract + geocode + publish)
Run:
```bash
node populate/publish-events.js "https://zilesinopti.ro/evenimente-bucuresti/?zi=YYYY-MM-DD"
```

Script output:
- Extracted count
- Unique count
- Per-event status (`✓` or `✗`)
- Final summary (`Success: X, Failed: Y`)

## Dates already executed successfully
- `2026-04-03` → `63/63` published
- `2026-04-04` → `70/70` published
- `2026-04-05` → `64/64` published

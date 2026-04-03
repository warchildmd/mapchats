# Task: Scrape & Publish Bucharest Events to GeoPost

## Steps

### 1. Load credentials
Read `populate/.env` and extract `ADMIN_TOKEN`.

### 2. Scrape events
Use WebFetch on:
```
https://zilesinopti.ro/evenimente-bucuresti-recomandate/
```

Prompt WebFetch to extract all events as a JSON array with this shape:
```json
{
  "title": "...",
  "location": "...",
  "description": "...",
  "date_time": "Vineri 03/04 20:00",
  "link": "https://zilesinopti.ro/evenimente/..."
}
```

Page structure per card: `<h2>`/`<h3>` with `<a href="/evenimente/...">` → title+link; first `<p>` starting with a Romanian day name + `DD/MM` → date; second `<p>` with `HH:MM` → time; `<p>` with `<a href="/locuri/...">` → location; remaining `<p>` → description. Combine date + time into `date_time`.

Print the extracted list as JSON before continuing.

### 3. Geocode each unique location
Use WebFetch on Nominatim (no auth required) for each distinct venue:
```
https://nominatim.openstreetmap.org/search?q={LOCATION}%2C+Bucure%C8%99ti&format=json&limit=1&countrycodes=ro
```
Take `[0].lat` and `[0].lon`. If the result is empty, fall back to Bucharest city center: `lat=44.4268, lng=26.1025`.

### 4. Parse dates & compute times
For each event, parse `date_time` (e.g. `"Vineri 03/04 20:00"`):
- Strip the Romanian day-name prefix (Luni/Marți/Miercuri/Joi/Vineri/Sâmbătă/Duminică).
- Parse `DD/MM HH:MM`. Year = current year unless the date is more than 60 days in the past → use next year.
- Bucharest is UTC+3 (EEST, April–October), so subtract 3h for UTC: `20:00 local → 17:00 UTC`.
- `publishAt = startTime − 12 hours`.

### 5. Publish each event via curl
For each event, write the JSON payload to a temp file (use `cat > /tmp/evN.json << 'EOF'` heredoc to safely handle Romanian characters and quotes), then POST:

```bash
curl -s -o /tmp/resp.json -w "%{http_code}" -X POST https://geopostapi.burduja.me/api/admin/posts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "@/tmp/evN.json"
```

Payload fields:
```json
{
  "category": "EVENT",
  "title": "<max 120 chars>",
  "content": "<description if available, else title; max 1000 chars>",
  "lat": 44.4355973,
  "lng": 26.0969873,
  "locationName": "<max 100 chars>",
  "publishAt": "2026-04-03T05:00:00.000Z",
  "startTime": "2026-04-03T17:00:00.000Z"
}
```

`201` = success. Print `✓` or `✗` with the event title for each.

#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const DEFAULT_URL = "https://zilesinopti.ro/evenimente-bucuresti/?zi=2026-04-03";
const API_URL = "https://geopostapi.burduja.me/api/admin/posts";
const GEOCODE_FALLBACK = { lat: 44.4268, lng: 26.1025 };
const GEOCODE_DELAY_MS = 1100;

const DAY_PREFIX_RE =
  /^(?:Luni|Marți|Marti|Miercuri|Joi|Vineri|Sâmbătă|Sambata|Duminică|Duminica)\s+/i;

function loadEnv(filePath) {
  const env = {};
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(value, maxLen) {
  const raw = String(value || "").trim();
  return raw.length <= maxLen ? raw : raw.slice(0, maxLen).trim();
}

function dedupeEvents(events) {
  const seen = new Set();
  const out = [];

  for (const event of events) {
    const key = `${event.link}|${event.date_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }

  return out;
}

function parseDateTimeToUtc(dateTime) {
  const stripped = String(dateTime || "").replace(DAY_PREFIX_RE, "").trim();
  const match = stripped.match(/^(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date_time format: "${dateTime}"`);
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const hour = Number(match[3]);
  const minute = Number(match[4]);

  let year = new Date().getFullYear();
  let candidateLocal = new Date(year, month - 1, day, hour, minute, 0, 0);
  const nowLocal = new Date();
  const diffDays = (candidateLocal.getTime() - nowLocal.getTime()) / 86400000;

  if (diffDays < -60) {
    year += 1;
    candidateLocal = new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  const utcMs = Date.UTC(year, month - 1, day, hour - 3, minute, 0, 0);
  const startTime = new Date(utcMs).toISOString();
  const publishAt = new Date(utcMs - 12 * 60 * 60 * 1000).toISOString();

  return { startTime, publishAt, yearResolved: year, localDate: candidateLocal };
}

async function geocodeLocation(locationName, cache, isFirstRequest) {
  const key = (locationName || "").trim() || "București";
  if (cache.has(key)) return cache.get(key);

  if (!isFirstRequest.value) {
    await sleep(GEOCODE_DELAY_MS);
  }
  isFirstRequest.value = false;

  const query = encodeURIComponent(`${key}, București`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ro`;

  try {
    const resp = await fetch(url, {
      headers: {
        "user-agent": "mapvibe-populate-script/1.0 (contact: local-script)",
        accept: "application/json",
      },
    });

    if (!resp.ok) {
      cache.set(key, GEOCODE_FALLBACK);
      return GEOCODE_FALLBACK;
    }

    const data = await resp.json();
    if (Array.isArray(data) && data[0] && data[0].lat && data[0].lon) {
      const point = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
      if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
        cache.set(key, point);
        return point;
      }
    }
  } catch {
    // Fall back below.
  }

  cache.set(key, GEOCODE_FALLBACK);
  return GEOCODE_FALLBACK;
}

async function publishEvent(event, token, geocodeCache, geocodeFirstReqRef) {
  const geo = await geocodeLocation(event.location, geocodeCache, geocodeFirstReqRef);
  const { startTime, publishAt } = parseDateTimeToUtc(event.date_time);

  const payload = {
    category: "EVENT",
    title: truncate(event.title, 120),
    content: truncate(event.description || event.title, 1000),
    lat: geo.lat,
    lng: geo.lng,
    locationName: truncate(event.location || "București", 100),
    publishAt,
    startTime,
  };

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (resp.status === 201) {
    return { ok: true, status: resp.status };
  }

  let details = "";
  try {
    details = (await resp.text()).slice(0, 300).replace(/\s+/g, " ").trim();
  } catch {
    details = "";
  }
  return { ok: false, status: resp.status, details };
}

async function main() {
  const targetUrl = process.argv[2] || DEFAULT_URL;
  const envPath = path.join(__dirname, ".env");
  const extractScript = path.join(__dirname, "extract-events.js");
  const env = loadEnv(envPath);
  const token = env.ADMIN_TOKEN;

  if (!token) {
    throw new Error("Missing ADMIN_TOKEN in populate/.env");
  }

  const extractedRaw = execFileSync(process.execPath, [extractScript, targetUrl], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });

  const extractedEvents = JSON.parse(extractedRaw);
  const events = dedupeEvents(extractedEvents);

  console.log(`Extracted events: ${extractedEvents.length}`);
  console.log(`Unique events to publish: ${events.length}`);

  const geocodeCache = new Map();
  const geocodeFirstReqRef = { value: true };
  let successCount = 0;
  let failCount = 0;

  for (const event of events) {
    try {
      const result = await publishEvent(event, token, geocodeCache, geocodeFirstReqRef);
      if (result.ok) {
        successCount += 1;
        console.log(`✓ ${event.title}`);
      } else {
        failCount += 1;
        const suffix = result.details ? ` :: ${result.details}` : "";
        console.log(`✗ [${result.status}] ${event.title}${suffix}`);
      }
    } catch (error) {
      failCount += 1;
      const message = error && error.message ? error.message : String(error);
      console.log(`✗ [ERROR] ${event.title} :: ${message}`);
    }
  }

  console.log(`Done. Success: ${successCount}, Failed: ${failCount}`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});


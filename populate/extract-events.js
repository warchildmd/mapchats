#!/usr/bin/env node

/**
 * Extracts events from a Zile si Nopti events page and prints JSON.
 * No external libraries required.
 *
 * Usage:
 *   node populate/extract-events.js
 *   node populate/extract-events.js "https://zilesinopti.ro/evenimente-bucuresti/?zi=2026-04-03"
 */

const DEFAULT_URL = "https://zilesinopti.ro/evenimente-bucuresti/?zi=2026-04-03";
const targetUrl = process.argv[2] || DEFAULT_URL;

const RO_DAY_NAMES = [
  "Duminică",
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
];

function decodeHtmlEntities(input) {
  if (!input) return "";

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    hellip: "…",
  };

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1].toLowerCase() === "x";
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (!Number.isNaN(codePoint)) return String.fromCodePoint(codePoint);
      return _;
    }
    return Object.prototype.hasOwnProperty.call(named, entity) ? named[entity] : _;
  });
}

function cleanText(input) {
  return decodeHtmlEntities(String(input || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTime(rawTime) {
  const match = cleanText(rawTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return cleanText(rawTime);
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function getDateFromUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const zi = parsed.searchParams.get("zi");
    if (!zi) return null;
    const match = zi.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  } catch {
    return null;
  }
}

function getDateFromHeading(html) {
  const match = html.match(/Astăzi,\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) };
}

function buildDefaultDateLabel(dateParts) {
  if (!dateParts) return "";
  const { year, month, day } = dateParts;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayName = RO_DAY_NAMES[utcDate.getUTCDay()] || "";
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dayName} ${dd}/${mm}`.trim();
}

function absoluteHref(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function extractEvents(html, pageUrl) {
  const fromUrl = getDateFromUrl(pageUrl);
  const fromHeading = getDateFromHeading(html);
  const defaultDateLabel = buildDefaultDateLabel(fromUrl || fromHeading);

  const marker = /<div class=['"]kzn-sw-item['"]>/g;
  const indices = [];
  let match;
  while ((match = marker.exec(html)) !== null) {
    indices.push(match.index);
  }

  const events = [];
  const seen = new Set();

  for (let i = 0; i < indices.length; i += 1) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : html.length;
    const block = html.slice(start, end);

    if (!/\/evenimente\//.test(block)) continue;

    const titleMatch = block.match(
      /<h3[^>]*kzn-sw-item-titlu[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!titleMatch) continue;

    const link = absoluteHref(titleMatch[1], pageUrl);
    const title = cleanText(titleMatch[2]);
    if (!title || !/\/evenimente\//.test(link)) continue;

    const locationMatch = block.match(
      /<div class="kzn-sw-text kzn-sw-item-adresa[^"]*">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
    );
    const location = locationMatch ? cleanText(locationMatch[1]) : "";

    const descriptionMatch = block.match(
      /<div class="kzn-sw-text kzn-sw-item-sumar[^"]*">\s*([\s\S]*?)\s*<\/div>/i
    );
    const description = descriptionMatch ? cleanText(descriptionMatch[1]) : "";

    const calendarMatch = block.match(/<i class=['"]eicon-calendar['"]><\/i>\s*([^<]+)/i);
    const clockMatch = block.match(/<i class=['"]eicon-clock-o['"]><\/i>\s*([^<]+)/i);

    const extractedDatePart = calendarMatch ? cleanText(calendarMatch[1]) : "";
    const datePart = extractedDatePart || defaultDateLabel;
    const timePart = clockMatch ? normalizeTime(clockMatch[1]) : "";
    const date_time = [datePart, timePart].filter(Boolean).join(" ").trim();

    const key = `${title}|${location}|${date_time}|${link}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      title,
      location,
      description,
      date_time,
      link,
    });
  }

  return events;
}

async function run() {
  const response = await fetch(targetUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; events-extractor/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl} (HTTP ${response.status})`);
  }

  const html = await response.text();
  const events = extractEvents(html, targetUrl);
  console.log(JSON.stringify(events, null, 2));
}

run().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

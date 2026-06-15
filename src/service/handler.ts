// handler.ts — go-date-web-app domain layer
// Pure, import-free, strictly-typed functions.

// ---------------------------------------------------------------------------
// Types (mirror proto messages)
// ---------------------------------------------------------------------------

export interface GetCurrentDateRequest {}

export interface GetCurrentDateResponse {
  // UTC fields
  date:        string; // "YYYY-MM-DD"
  time:        string; // "HH:mm:ss"
  day_of_week: string; // "Monday" … "Sunday"
  timezone:    string; // "UTC"
  iso8601:     string; // ISO-8601 full timestamp

  // IST fields (UTC + 5:30)
  ist_date:        string; // "YYYY-MM-DD"
  ist_time:        string; // "HH:mm:ss"
  ist_day_of_week: string; // "Monday" … "Sunday"
  ist_timezone:    string; // "IST"
}

export interface HttpDatePageRequest {
  /** Optional IANA timezone string forwarded from the query-string, e.g. "America/New_York". Falls back to UTC. */
  timezone?: string;
}

export interface HttpDatePageResponse {
  /** Ready-to-serve HTML string */
  html: string;
  /** HTTP status code */
  status: number;
}

// ---------------------------------------------------------------------------
// Core domain function
// ---------------------------------------------------------------------------

/**
 * getCurrentDate
 * Returns a structured representation of the current date/time in both UTC
 * and IST (UTC + 5 hours 30 minutes).
 * Pure: the caller supplies `now` so the function remains unit-testable.
 */
export function getCurrentDate(
  _req: GetCurrentDateRequest,
  now: Date = new Date()
): GetCurrentDateResponse {
  const pad = (n: number, len = 2): string => String(n).padStart(len, "0");

  const days: readonly string[] = [
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
  ];

  // ── UTC ──────────────────────────────────────────────────────────────────
  const utcYear  = now.getUTCFullYear();
  const utcMonth = pad(now.getUTCMonth() + 1);
  const utcDay   = pad(now.getUTCDate());
  const utcHours = pad(now.getUTCHours());
  const utcMins  = pad(now.getUTCMinutes());
  const utcSecs  = pad(now.getUTCSeconds());
  const utcDow   = days[now.getUTCDay()];

  // ── IST (UTC + 5h 30m) ───────────────────────────────────────────────────
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const istNow  = new Date(now.getTime() + IST_OFFSET_MS);

  const istYear  = istNow.getUTCFullYear();
  const istMonth = pad(istNow.getUTCMonth() + 1);
  const istDay   = pad(istNow.getUTCDate());
  const istHours = pad(istNow.getUTCHours());
  const istMins  = pad(istNow.getUTCMinutes());
  const istSecs  = pad(istNow.getUTCSeconds());
  const istDow   = days[istNow.getUTCDay()];

  return {
    // UTC
    date:        `${utcYear}-${utcMonth}-${utcDay}`,
    time:        `${utcHours}:${utcMins}:${utcSecs}`,
    day_of_week: utcDow,
    timezone:    "UTC",
    iso8601:     now.toISOString(),

    // IST
    ist_date:        `${istYear}-${istMonth}-${istDay}`,
    ist_time:        `${istHours}:${istMins}:${istSecs}`,
    ist_day_of_week: istDow,
    ist_timezone:    "IST (UTC+5:30)",
  };
}

// ---------------------------------------------------------------------------
// HTML renderer
// ---------------------------------------------------------------------------

/**
 * renderDatePage
 * Composes a fully self-contained HTML page displaying the current date/time
 * in both UTC and IST side-by-side.
 * Pure: accepts a pre-built GetCurrentDateResponse so rendering is testable
 * independently of the clock.
 */
export function renderDatePage(data: GetCurrentDateResponse): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Current Date — go-date-web-app</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #e0f7fa;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
      padding: 2rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 3rem 4rem;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      max-width: 480px;
      width: 90%;
    }

    /* Accent colour for the IST card */
    .card.ist {
      border-color: rgba(255, 183, 77, 0.35);
      background: rgba(255, 183, 77, 0.07);
    }

    .card-title {
      font-size: 0.75rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 1.2rem;
      padding: 0.3rem 1rem;
      border-radius: 999px;
      display: inline-block;
    }
    .card .card-title          { background: rgba(77, 208, 225, 0.18); color: #4dd0e1; border: 1px solid rgba(77, 208, 225, 0.35); }
    .card.ist .card-title      { background: rgba(255, 183, 77, 0.18); color: #ffb74d; border: 1px solid rgba(255, 183, 77, 0.45); }

    .label {
      font-size: 0.85rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #80deea;
      margin-bottom: 0.4rem;
    }
    .card.ist .label { color: #ffe082; }

    .day-of-week {
      font-size: 1.4rem;
      font-weight: 300;
      color: #b2ebf2;
      margin-bottom: 0.5rem;
    }
    .card.ist .day-of-week { color: #ffe0b2; }

    .date {
      font-size: 3.5rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      color: #ffffff;
    }

    .time {
      font-size: 2.2rem;
      font-weight: 300;
      margin-top: 1rem;
      color: #e0f7fa;
    }

    .iso {
      margin-top: 1.5rem;
      font-size: 0.78rem;
      color: #4dd0e1;
      font-family: monospace;
      word-break: break-all;
    }
    .card.ist .iso { color: #ffb74d; }

    .timezone-badge {
      display: inline-block;
      margin-top: 1.2rem;
      padding: 0.25rem 0.9rem;
      border-radius: 999px;
      background: rgba(77, 208, 225, 0.18);
      font-size: 0.8rem;
      letter-spacing: 0.1em;
      color: #4dd0e1;
      border: 1px solid rgba(77, 208, 225, 0.35);
    }
    .card.ist .timezone-badge {
      background: rgba(255, 183, 77, 0.18);
      color: #ffb74d;
      border-color: rgba(255, 183, 77, 0.45);
    }

    .refresh-btn {
      margin-top: 2rem;
      padding: 0.6rem 1.8rem;
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, #00acc1, #00838f);
      color: #fff;
      font-size: 0.95rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .refresh-btn:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- UTC card -->
    <div class="card">
      <div class="card-title">UTC</div>
      <div class="label">Today is</div>
      <div class="day-of-week">${data.day_of_week}</div>
      <div class="date">${data.date}</div>
      <div class="time">${data.time}</div>
      <div class="iso">${data.iso8601}</div>
      <div class="timezone-badge">${data.timezone}</div>
      <br/>
      <button class="refresh-btn" onclick="window.location.reload()">Refresh</button>
    </div>

    <!-- IST card -->
    <div class="card ist">
      <div class="card-title">IST</div>
      <div class="label">Today is</div>
      <div class="day-of-week">${data.ist_day_of_week}</div>
      <div class="date">${data.ist_date}</div>
      <div class="time">${data.ist_time}</div>
      <div class="iso">${data.iso8601}</div>
      <div class="timezone-badge">${data.ist_timezone}</div>
      <br/>
      <button class="refresh-btn" onclick="window.location.reload()">Refresh</button>
    </div>

  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTTP handler (Fastify-agnostic request/response objects)
// ---------------------------------------------------------------------------

/**
 * handleDatePage
 * Orchestrates getCurrentDate + renderDatePage.
 * Accepts an optional timezone hint (currently informational; UTC and IST are always served).
 */
export function handleDatePage(req: HttpDatePageRequest): HttpDatePageResponse {
  const dateData = getCurrentDate({});
  const html     = renderDatePage(dateData);
  return { html, status: 200 };
}

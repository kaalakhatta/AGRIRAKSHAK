// Separate weather v1 contract: forecast issuance is unknown, never invented.
export const CACHE_MS = 30 * 60_000;
export const THROTTLE_MS = 60_000;
export type Weather = {
  schema_version: "weather-1"; fetched_at: string; observed_at: string; issued_at: null;
  interval_seconds: number; timezone: string;
  current: { temperature: number | null; humidity: number | null; precipitation: number | null; wind: number | null };
  days: { date: string; minimum: number | null; maximum: number | null; precipitation: number | null }[];
};
export class WeatherError extends Error {
  retryAt: number; transient: boolean;
  constructor(message: string, retryAt = 0, transient = false) { super(message); this.retryAt = retryAt; this.transient = transient; }
}
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new WeatherError("Weather response has an unsupported format.");
  return v as Record<string, unknown>;
}
function number(v: unknown, min = -150, max = 150): number | null {
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new WeatherError("Weather value is invalid.");
  return v;
}
export function parseWeather(raw: unknown, now: number): Weather {
  const root = object(raw), c = object(root.current), cu = object(root.current_units), d = object(root.daily), du = object(root.daily_units);
  const expected = { temperature_2m: "°C", relative_humidity_2m: "%", precipitation: "mm", wind_speed_10m: "m/s" };
  for (const [key, unit] of Object.entries(expected)) if (cu[key] !== unit) throw new WeatherError("Unsupported weather units.");
  for (const key of ["temperature_2m_min", "temperature_2m_max", "precipitation_sum"]) if (du[key] !== (key === "precipitation_sum" ? "mm" : "°C")) throw new WeatherError("Unsupported forecast units.");
  if (root.utc_offset_seconds !== 0 || typeof root.timezone !== "string" || typeof c.time !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(c.time)) throw new WeatherError("Weather timestamps are invalid.");
  const observed = Date.parse(c.time + ":00Z");
  if (!Number.isFinite(observed) || observed > now || new Date(observed).toISOString().slice(0,16) !== c.time) throw new WeatherError("Weather observation time is invalid or future.");
  if (typeof c.interval !== "number" || !Number.isInteger(c.interval) || c.interval <= 0 || c.interval > 86400) throw new WeatherError("Precipitation interval is missing.");
  const keys = ["time", "temperature_2m_min", "temperature_2m_max", "precipitation_sum"];
  const arrays = keys.map(key => d[key]);
  if (!arrays.every(a => Array.isArray(a) && a.length === 7)) throw new WeatherError("Seven complete forecast days are required.");
  const [dates, mins, maxs, rain] = arrays as unknown[][];
  const days = dates.map((date, i) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || (i && Date.parse(date) - Date.parse(String(dates[i-1])) !== 86400000)) throw new WeatherError("Forecast dates are invalid.");
    const minimum = number(mins[i]), maximum = number(maxs[i]);
    if (minimum !== null && maximum !== null && minimum > maximum) throw new WeatherError("Forecast temperature range is invalid.");
    return { date, minimum, maximum, precipitation: number(rain[i], 0, 10000) };
  });
  if (Math.abs(Date.parse(days[0].date) - Date.parse(new Date(now).toISOString().slice(0,10))) > 86400000) throw new WeatherError("Forecast is outside the requested horizon.");
  return { schema_version: "weather-1", fetched_at: new Date(now).toISOString(), observed_at: new Date(observed).toISOString(), issued_at: null, interval_seconds: c.interval, timezone: root.timezone, current: { temperature: number(c.temperature_2m), humidity: number(c.relative_humidity_2m,0,100), precipitation: number(c.precipitation,0,10000), wind: number(c.wind_speed_10m,0,150) }, days };
}
export function weatherFresh(weather: Weather, now: number) {
  const fetched = now - Date.parse(weather.fetched_at), observed = now - Date.parse(weather.observed_at);
  return fetched >= 0 && fetched < CACHE_MS && observed >= 0 && observed < CACHE_MS;
}
export function weatherURL(latitude: number, longitude: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m", daily: "temperature_2m_min,temperature_2m_max,precipitation_sum", timezone: "GMT", wind_speed_unit: "ms", forecast_days: "7" }).toString();
  return url;
}
// Explicit transport for the consented setup flow when browser-to-provider access fails.
// The server uses the same free provider and the same validation; no paid fallback.
export function setupWeatherTransport(http: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    if (url.origin !== "https://api.open-meteo.com" || url.pathname !== "/v1/forecast") throw new WeatherError("Unsupported weather destination.");
    return http("/api/weather-context", { ...init, method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({latitude:Number(url.searchParams.get("latitude")),longitude:Number(url.searchParams.get("longitude"))}) });
  };
}
export class WeatherClient {
  private cache = new Map<string, Weather>();
  private nextRequest = 0;
  private epoch = 0;
  private controllers = new Set<AbortController>();
  private http: typeof fetch; private clock: () => number; private delay: (ms: number) => Promise<void>;
  constructor(http: typeof fetch = fetch, clock = () => Date.now(), delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))) { this.http = http; this.clock = clock; this.delay = delay; }
  clear() { this.epoch++; this.cache.clear(); for (const c of this.controllers) c.abort(); }
  cached(latitude: number, longitude: number) { return this.cache.get(`${latitude},${longitude}`); }
  async get(latitude: number, longitude: number, refresh = false): Promise<Weather> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new WeatherError("Confirmed field coordinates are required.");
    const epoch = this.epoch;
    const key = `${latitude},${longitude}`, cached = this.cache.get(key), now = this.clock();
    if (!refresh && cached && weatherFresh(cached, now)) return cached;
    if (now < this.nextRequest) throw new WeatherError("Please wait before requesting weather again.", this.nextRequest);
    this.nextRequest = now + THROTTLE_MS;
    const url = weatherURL(latitude, longitude);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (epoch !== this.epoch) throw new WeatherError("Weather sharing was stopped.");
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
      this.controllers.add(controller);
      try {
        const response = await this.http(url, { signal: controller.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
        if (response.status === 429) {
          const header = response.headers.get("Retry-After"), seconds = header ? Number(header) : NaN;
          const retry = Number.isFinite(seconds) ? this.clock() + Math.max(0,seconds) * 1000 : Date.parse(header ?? "");
          this.nextRequest = Math.max(this.nextRequest, Number.isFinite(retry) ? retry : this.clock() + THROTTLE_MS);
          throw new WeatherError("Weather service is rate limited. Cached values remain available.", this.nextRequest);
        }
        if (!response.ok) throw new WeatherError("Weather service is unavailable. Try again later.",0,response.status >= 500);
        const result = parseWeather(await response.json(), this.clock());
        if (epoch !== this.epoch) throw new WeatherError("Weather sharing was stopped.");
        this.cache.set(key,result); return result;
      } catch (error) {
        if (epoch !== this.epoch) throw new WeatherError("Weather sharing was stopped.");
        const safe = error instanceof WeatherError ? error : new WeatherError("Weather could not be fetched. Check your connection and try later.",0,true);
        if (attempt === 1 || !safe.transient) throw safe;
      } finally { clearTimeout(timeout); this.controllers.delete(controller); }
      await this.delay(1000);
    }
    throw new WeatherError("Weather is unavailable.");
  }
}

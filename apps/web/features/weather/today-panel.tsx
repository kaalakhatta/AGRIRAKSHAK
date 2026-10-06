"use client";
import { useEffect, useRef, useState } from "react";
import { todayInZone, type Coordinates, type CropCycle, type Field } from "@/lib/domain/farm";
import { WeatherClient, WeatherError, weatherFresh, type Weather } from "@/lib/providers/weather";
import { EMPTY_CATALOG, evaluateCatalog } from "@/lib/recommendations/engine";

import { taskTiming, dueDate, type CalendarTask } from "@/lib/domain/calendar";

let sessionClient: WeatherClient | null = null;

export function TodayPanel({ field, cycles, location, tasks, timezone }: { field: Field; cycles: CropCycle[]; location: Coordinates | null; tasks: CalendarTask[]; timezone: string }) {
  const client = useRef<WeatherClient | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null), [error,setError] = useState("");
  const [busy,setBusy] = useState(false), [consent,setConsent] = useState(false), [now,setNow] = useState(0);
  const [retryAt,setRetryAt] = useState(0), [cycleId,setCycleId] = useState(cycles[0]?.id ?? "");
  const generation = useRef(0), pending = useRef(false);
  useEffect(() => {
    sessionClient ??= new WeatherClient(); client.current = sessionClient;
    const requests = generation, weatherClient = sessionClient;
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => { clearTimeout(initial); clearInterval(timer); requests.current++; weatherClient.clear(); };
  }, []);
  const cycle = cycles.find(c => c.id === cycleId);
  async function fetchWeather() {
    if (!location || !consent || pending.current || !client.current) return;
    pending.current = true; setBusy(true); setError(""); const request = generation.current;
    try { const result = await client.current.get(location.latitude,location.longitude,!!weather); if (generation.current === request) { setWeather(result); setNow(Date.now()); setRetryAt(0); } }
    catch (e) { if (generation.current === request) { setError(e instanceof Error ? e.message : "Weather is unavailable."); if (e instanceof WeatherError) setRetryAt(e.retryAt); } }
    finally { pending.current = false; if (generation.current === request) setBusy(false); }
  }
  function revoke() { generation.current++; client.current?.clear(); setConsent(false); setWeather(null); setError(""); setBusy(false); }
  const fresh = weather && weatherFresh(weather,now);
  const decisions = evaluateCatalog(EMPTY_CATALOG,field.id,{},now);
  const prompts = [!field.region && "Add your field’s region to check catalog coverage.", field.water === "unknown" && "Record water access when you know it.", !cycle && "Select or add a crop cycle.", cycle && !cycle.sowing_date && "Add a sowing date when known.", cycle && !cycle.stage && "Confirm the current crop stage when known.", cycle && !cycle.season && "Record the intended season.", !location && "Add confirmed field coordinates only if you want weather."] .filter(Boolean);
  const value = (v: number | null, unit: string) => v === null ? "Unavailable" : `${v} ${unit}`;
  return <section className="farm-card today-section" id="today" aria-labelledby="today-title">
    <div className="card-heading"><div><p className="eyebrow">{field.name} · field overview</p><h2 id="today-title">Today on your farm</h2></div><span className="cycle-badge">{field.origin === "demo" ? "Synthetic demo field" : "Your field record"}</span></div>
    <label>Crop cycle<select value={cycleId} onChange={e => setCycleId(e.target.value)}><option value="">No cycle selected</option>{cycles.map(c => <option key={c.id} value={c.id}>{c.crop} · {c.status}</option>)}</select></label>
    <div className="farm-grid"><div><h3>Weather near this field</h3><p>Modelled weather estimates, separate from field sensors. Forecast days use UTC.</p>
      {location ? <><label className="check-label"><input type="checkbox" checked={consent} onChange={e => e.target.checked ? setConsent(true) : revoke()} />Send these field coordinates to Open-Meteo for weather in this session. The provider receives coordinates and your network address.</label><div className="button-row"><button className="button button-primary" type="button" disabled={!consent || busy || retryAt > now} onClick={() => void fetchWeather()}>{busy ? "Fetching weather…" : weather ? "Refresh weather" : "Fetch field weather"}</button>{consent && <button type="button" className="text-button" onClick={revoke}>Stop weather sharing and clear cache</button>}</div></> : <p>Weather unavailable: no confirmed location. You can continue keeping records and using the scanner.</p>}
      <div aria-live="polite">{error && <p role="alert">{error}</p>}{retryAt > now && <p>Next request after {new Date(retryAt).toLocaleTimeString()}.</p>}</div>
      {weather && <><p className={fresh ? "success-note" : "form-error"}>{fresh ? "Fetched estimates" : "Stale cached estimates — display only"} · retrieved {new Date(weather.fetched_at).toLocaleString()}</p><p>Estimate valid at {new Date(weather.observed_at).toLocaleString()}. Current precipitation covers {weather.interval_seconds / 60} minutes. Forecast issuance: unknown.</p>
        <dl className="weather-metrics"><div><dt>Air temperature</dt><dd>{value(weather.current.temperature,"°C")}</dd></div><div><dt>Relative humidity</dt><dd>{value(weather.current.humidity,"%")}</dd></div><div><dt>Precipitation</dt><dd>{value(weather.current.precipitation,"mm")}</dd></div><div><dt>Wind at 10 m</dt><dd>{value(weather.current.wind,"m/s")}</dd></div></dl>
        <div className="forecast-scroll"><table><caption>Seven-day forecast · UTC · estimates</caption><thead><tr><th scope="col">Date</th><th scope="col">Min / max °C</th><th scope="col">Precipitation mm/day</th></tr></thead><tbody>{weather.days.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.minimum ?? "—"} / {day.maximum ?? "—"}</td><td>{day.precipitation ?? "Unavailable"}</td></tr>)}</tbody></table></div>
      </>}
      <p><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Free non-commercial endpoint; session cache only. Reloading clears estimates.</p>
    </div><div><h3>Build a better field record</h3><p>These are information prompts. They do not prescribe farming actions.</p>{prompts.length ? <ul>{prompts.map((prompt,i) => <li key={i}>{prompt}</li>)}</ul> : <p>Your basic field and cycle details are recorded.</p>}
      <h3>Your due reminders</h3>{!cycle ? <p>Select a cycle to see its reminders.</p> : tasks.filter(t=>t.cycle_id===cycle.id && t.status === "pending" && ["Due today","Overdue","Ready at your confirmed stage"].includes(taskTiming(t,cycle,todayInZone(timezone)))).length ? <ul>{tasks.filter(t=>t.cycle_id===cycle.id && t.status === "pending" && ["Due today","Overdue","Ready at your confirmed stage"].includes(taskTiming(t,cycle,todayInZone(timezone)))).map(t=><li key={t.id}>{t.title} · {taskTiming(t,cycle,todayInZone(timezone))} {dueDate(t) ?? ""}</li>)}</ul> : <p>No pending reminders are due for this cycle.</p>}<p><a href="/plan">Manage your personal reminders →</a></p>
      <div className="location-box"><h3>Reviewed guidance</h3><p>{decisions.length ? "Reviewed rules evaluated." : "No reviewed agricultural catalog is available yet. Seed, irrigation and soil actions are awaiting evidence and human review."}</p><p>Soil measurements: unavailable. Live sensors: unavailable. Coordinates cannot establish soil pH or nutrients.</p><p>Leaf screening remains available from the scanner. Its current predictions are labelled simulations.</p></div>
    </div></div>
  </section>;
}

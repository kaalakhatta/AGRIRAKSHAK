import { parseWeather, CACHE_MS, type Weather } from './weather.ts';
import { WRB_CLASSES, type MappedSoil } from './field-context.ts';
// One-use, same-tab transfer across full-document navigation. Never includes coordinates,
// names or diaries; does not grant permission for another online request.
const KEY='agrirakshak-dashboard-context-1';
export type DashboardContext={schema_version:1;field_id:string;cycle_id:string;created_at:string;weather:Weather|null;soil:MappedSoil|null};
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function prepareDashboardContext(storage:StoragePort,field_id:string,cycle_id:string,weather:Weather|null,soil:MappedSoil|null,now:number) {
  try {
    if(!weather&&!soil){storage.removeItem(KEY);return;}
    const draft={schema_version:1,field_id,cycle_id,created_at:new Date(now).toISOString(),weather,soil};
    const value=validateDashboardContext(draft,field_id,cycle_id,now);
    storage.setItem(KEY,JSON.stringify(value));
  } catch {try{storage.removeItem(KEY);}catch{/* Storage may be blocked; navigation still works. */}}
}
export function validateDashboardContext(raw:unknown,field:string,cycle:string,now:number):DashboardContext {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid context transfer.');
  const d=raw as DashboardContext;
  const age=now-Date.parse(d.created_at);
  if(d.schema_version!==1||d.field_id!==field||d.cycle_id!==cycle||!Number.isFinite(age)||age<0||age>=CACHE_MS)throw Error('Context is expired or belongs to another cycle.');
  let weather:Weather|null=null,soil:MappedSoil|null=null;
  if(d.weather!==null) {
    const w=d.weather,at=Date.parse(w.fetched_at);
    if(w.schema_version!=='weather-1'||w.issued_at!==null||!Number.isFinite(at)||at>now||now-at>=CACHE_MS)throw Error('Weather transfer is expired.');
    weather=parseWeather({timezone:w.timezone,utc_offset_seconds:0,current:{time:w.observed_at.slice(0,16),interval:w.interval_seconds,temperature_2m:w.current.temperature,relative_humidity_2m:w.current.humidity,precipitation:w.current.precipitation,wind_speed_10m:w.current.wind},current_units:{temperature_2m:'°C',relative_humidity_2m:'%',precipitation:'mm',wind_speed_10m:'m/s'},daily:{time:w.days.map(d=>d.date),temperature_2m_min:w.days.map(d=>d.minimum),temperature_2m_max:w.days.map(d=>d.maximum),precipitation_sum:w.days.map(d=>d.precipitation)},daily_units:{temperature_2m_min:'°C',temperature_2m_max:'°C',precipitation_sum:'mm'}},at);
    // parseWeather preserves the original fetch/observation time; transfer is not a refresh.
    if(weather.observed_at!==w.observed_at||weather.fetched_at!==w.fetched_at)throw Error('Invalid context timestamps.');
  }
  if(d.soil!==null) {
    const s=d.soil,age=now-Date.parse(s.fetched_at);
    if(s.kind!=='soil_map'||s.source!=='https://maps.isric.org/'||s.reference_year!==null||!WRB_CLASSES.includes(s.soil_class)||!Number.isFinite(age)||age<0||age>=CACHE_MS)throw Error('Invalid soil transfer.');
    soil={kind:'soil_map',soil_class:s.soil_class,source:s.source,reference_year:null,fetched_at:s.fetched_at};
  }
  return {schema_version:1,field_id:field,cycle_id:cycle,created_at:d.created_at,weather,soil};
}
export function consumeDashboardContext(storage:StoragePort,field:string,cycle:string,now:number):DashboardContext|null {
  try{const text=storage.getItem(KEY);if(!text)return null;if(text.length>15000)throw Error('Context too large.');const result=validateDashboardContext(JSON.parse(text),field,cycle,now);storage.removeItem(KEY);return result;}catch{try{storage.removeItem(KEY);}catch{/* Optional transfer only. */}return null;}
}

import type { SoilTest } from "../domain/soil.ts";
import { taskTiming, dueDate, type CalendarTask } from '../domain/calendar.ts';
import { type CropCycle, type Field } from '../domain/farm.ts';
import { weatherFresh, type Weather } from '../providers/weather.ts';

export const GOALS = ['All next steps', 'Crop planning', 'Water & weather', 'Season tracking'] as const;
export type Goal = typeof GOALS[number];
export type NextStep = { id: string; goal: Goal; title: string; why: string; action: string; href: string; inputs: string[]; timing: string };
export function recommendNextSteps({ field, cycle, tasks, soilTests = [], weather, hasLocation, today, now }: {field: Field; cycle?: CropCycle; tasks: CalendarTask[]; soilTests?: SoilTest[]; weather: Weather | null; hasLocation: boolean; today: string; now: number}): NextStep[] {
  const steps: NextStep[] = [];
  const add = (id: string, goal: Goal, title: string, why: string, action: string, href: string, inputs: string[], timing = 'When you know the details') => steps.push({id,goal,title,why,action,href,inputs,timing});
  // Ignore a cycle from another field, even if a caller supplies one.
  const selected = cycle?.field_id === field.id ? cycle : undefined;
  if (selected) for (const task of tasks.filter(t => t.cycle_id === selected.id && t.status === 'pending')) {
    const timing = taskTiming(task, selected, today);
    if (['Overdue','Due today','Ready at your confirmed stage'].includes(timing)) add(`task:${task.id}`, 'Season tracking', task.title, 'This is a reminder you scheduled for this crop cycle. Review whether it still applies before acting.', 'Review reminder', '/plan', [selected.crop, dueDate(task) ? `Scheduled date: ${dueDate(task)}` : 'At your confirmed stage'], timing);
    else if (timing === 'Waiting for sowing date') add(`anchor:${task.id}`, 'Season tracking', `Set the date for “${task.title}”`, 'This reminder cannot be scheduled until you confirm its sowing-date anchor in Plan.', 'Update reminder', '/plan', [selected.crop, 'Sowing anchor missing']);
  }
  if (!selected) add('cycle','Crop planning','Choose a crop cycle','Your field is recorded, but recommendations need a selected crop and season.', 'Add or select a cycle','/farm',[field.name]);
  const missing = [!field.region && 'region', selected && !selected.season && 'season', selected && !selected.variety && 'variety (if known)'].filter(Boolean) as string[];
  if (missing.length) add('coverage','Crop planning','Prepare your seed comparison',`Still missing: ${missing.join(', ')}. These details help check regional seed evidence; they do not establish suitability on their own.`,'Update field and crop details','/farm',[selected?.crop ?? 'Crop not selected', field.region ?? 'Region unknown', selected?.season ?? 'Season unknown']);
  if (field.water === 'unknown') add('water','Water & weather','Record your available water supply','Water access is unknown. Keep it explicit so future crop and water guidance can check the right prerequisites.','Update water access','/farm',['Water access: unknown']);
  if (!weather || !weatherFresh(weather,now)) add('weather','Water & weather', !weather ? 'Get weather context for your field' : 'Refresh old weather estimates', hasLocation ? 'Use the weather consent and fetch controls above. Weather estimates provide context; field conditions still need your own observations.' : 'Confirm a field location and choose whether to share it for weather. You can continue without location.', hasLocation ? 'Open weather controls' : 'Set an optional field location',hasLocation ? '#today' : '/farm',[!weather ? 'Weather unavailable' : `Estimate time: ${weather.observed_at}`], 'Before reviewing weather-dependent plans');
  else add('weather-review','Water & weather','Review the weather alongside your plans',`Available estimates: temperature ${weather.current.temperature === null ? 'unavailable' : weather.current.temperature+' °C'}, precipitation ${weather.current.precipitation === null ? 'unavailable' : weather.current.precipitation+' mm over '+weather.interval_seconds/60+' minutes'}. These figures do not determine irrigation or safe field-work thresholds.`, 'Review weather', '#today', ['Open-Meteo weather estimates', `Valid at ${weather.observed_at}`], 'Current context');
  if (selected && !selected.sowing_date) add('sowing','Season tracking','Anchor your crop calendar','The sowing date is unknown. Add it if known so your own relative reminders can be scheduled; stage reminders can work with a confirmed stage.','Update crop dates','/farm',[selected.crop,'Sowing date unknown']);
  if (selected?.status === 'active' && !selected.stage) add('stage','Season tracking','Confirm the stage you observe','The active crop has no confirmed stage. The app cannot infer it from elapsed time or a leaf photo.','Record observed stage','/farm',[selected.crop,'Active cycle']);
  if (selected && !tasks.some(t=>t.cycle_id === selected.id)) add('diary','Season tracking','Start a personal field-check routine','This cycle has no reminders. Choose your own check date and what you want to record; the app does not assign an agronomic interval.','Create a reminder','/plan',[selected.crop,'No personal reminders']);
  const measured = soilTests.filter(t=>t.field_id === field.id && t.origin !== 'demo');
  const latest = [...measured].sort((a,b)=>b.sample_date.localeCompare(a.sample_date) || a.id.localeCompare(b.id))[0];
  if (!latest) add('soil-record','Season tracking','Add a measured soil result if available','There are no non-demo soil tests recorded for this field. If you already have a report, copy its values and original units; otherwise leave soil data unknown.','Open soil notebook','/records',[field.name,'Measured soil data not recorded']);
  else add('soil-review','Season tracking','Review your recorded soil evidence',`Your latest entered sample is dated ${latest.sample_date}, from ${latest.source}. ${!latest.depth_cm || latest.readings.some(r=>r.method === null) ? 'Some depth or method details are unknown. Add them only if your report supplies them.' : 'Depth and method details are recorded.'} No rule has confirmed that this sample is suitable or recent enough for advice.`, 'Review soil test','/records',[field.name,latest.sample_date, latest.source_kind === 'soil_lab' ? 'Self-reported lab result' : 'Self-reported manual test']);
  return steps;
}

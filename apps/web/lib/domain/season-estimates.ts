import { addDays, dueDate, type CalendarTask } from './calendar.ts';
import { validateDate, type CropCycle, type Field } from './farm.ts';
import type { Weather } from '../providers/weather.ts';
export const MATURITY_SOURCE = 'https://icar-nsri.res.in/aicrps_var.html';
// Published Central Zone characteristics, not a seed recommendation or reviewed action rule.
export const SOYBEAN_MATURITY = [
  {variety:'JS 97-52',days:[100,100]}, {variety:'JS 20-29',days:[93,96]},
  {variety:'JS 20-34',days:[86,88]}, {variety:'NRC 86',days:[95,97]},
  {variety:'Raj Soya 24 (RVS 2002-4)',days:[96,96]}, {variety:'JS 20-98',days:[96,101]},
  {variety:'NRC 127',days:[102,102]}, {variety:'JS 20-94',days:[97,99]},
  {variety:'JS 20-116',days:[100,109]},
] as const;
export function maturityEstimate(field: Pick<Field,'region'>, cycle: Pick<CropCycle,'crop'|'season'|'variety'|'sowing_date'>) {
  if (!/^soya?bean$/i.test(cycle.crop) || !field.region || !/^([^,]+,\s*)?madhya pradesh$/i.test(field.region.trim()) || cycle.season?.toLowerCase() !== 'kharif' || !cycle.sowing_date) return null;
  validateDate(cycle.sowing_date);
  const normal = (v:string)=>v.toUpperCase().replace(/[^A-Z0-9]/g,'');
  const entry = SOYBEAN_MATURITY.find(v=>normal(v.variety) === normal(cycle.variety??''));
  if (!entry) return null;
  return {variety:entry.variety,days:entry.days,start:addDays(cycle.sowing_date,entry.days[0]),end:addDays(cycle.sowing_date,entry.days[1]),source:MATURITY_SOURCE};
}
export type SeasonMark = {date:string;label:string;kind:'sowing'|'maturity'|'reminder'|'rain';done?:boolean};
export function seasonMarks(field: Pick<Field,'region'>, cycle: CropCycle, tasks: CalendarTask[], weather: Weather|null): SeasonMark[] {
  const marks:SeasonMark[] = [];
  if (cycle.sowing_date) marks.push({date:cycle.sowing_date,label:'Sowing date',kind:'sowing'});
  const maturity = maturityEstimate(field,cycle);
  if (maturity) for (let date=maturity.start;date<=maturity.end;date=addDays(date,1)) marks.push({date,label:'Estimated maturity / harvest planning',kind:'maturity'});
  for (const task of tasks.filter(t=>t.cycle_id===cycle.id)) {const date=dueDate(task);if(date)marks.push({date,label:task.title,kind:'reminder',done:task.status==='done'});}
  for (const day of weather?.days??[]) if (day.precipitation!==null) marks.push({date:day.date,label:`Forecast rain: ${day.precipitation} mm (UTC day)`,kind:'rain'});
  return marks.sort((a,b)=>a.date.localeCompare(b.date));
}
export function calendarCells(month: string): (string|null)[] {
  if (!/^\d{4}-\d{2}$/.test(month)) throw Error('Invalid calendar month.');
  validateDate(`${month}-01`);
  const first = new Date(`${month}-01T00:00:00Z`), count = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
  const cells:(string|null)[] = Array.from({length:(first.getUTCDay()+6)%7},()=>null);
  for(let n=1;n<=count;n++)cells.push(`${month}-${String(n).padStart(2,'0')}`);
  while(cells.length%7)cells.push(null);
  return cells;
}

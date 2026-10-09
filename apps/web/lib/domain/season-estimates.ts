import { addDays, dueDate, type CalendarTask } from './calendar.ts';
import { validateDate, type CropCycle, type Field } from './farm.ts';
import type { Weather } from '../providers/weather.ts';
import { marketCrop } from '../providers/market-prices.ts';
export const MATURITY_SOURCE = 'https://icar-nsri.res.in/aicrps_var.html';
// Published Central Zone characteristics, not a seed recommendation or reviewed action rule.
export const SOYBEAN_MATURITY = [
  {variety:'JS 97-52',days:[100,100]}, {variety:'JS 20-29',days:[93,96]},
  {variety:'JS 20-34',days:[86,88]}, {variety:'NRC 86',days:[95,97]},
  {variety:'Raj Soya 24 (RVS 2002-4)',days:[96,96]}, {variety:'JS 20-98',days:[96,101]},
  {variety:'NRC 127',days:[102,102]}, {variety:'JS 20-94',days:[97,99]},
  {variety:'JS 20-116',days:[100,109]},
] as const;
export const WHEAT_SOURCE='https://www.iari.res.in/files/Publication/Others/Tech_Options_English-15072014.pdf';
export const GRAM_SOURCE='https://www.icar-iipr.org.in/varity/';
export const PUSA_GRAM_SOURCE='https://icar.org.in/en/icar-iari-develops-climate-smart-drought-hardy-chickpea-variety-pusa-jg-16';
export type MaturityEntry={variety:string;aliases?:readonly string[];days:readonly [number,number];source:string;conditions:string};
export function maturityEntries(crop:string):MaturityEntry[] {
  switch(marketCrop(crop)) {
    case 'soybean':return SOYBEAN_MATURITY.map(v=>({...v,source:MATURITY_SOURCE,conditions:'Central Zone / Kharif'}));
    case 'wheat':return [
      {variety:'HI 1544 (Purna)',aliases:['HI 1544'],days:[110,115],source:WHEAT_SOURCE,conditions:'Central Zone, timely sown, irrigated'},
      {variety:'HD 2932 (Pusa Wheat 111)',aliases:['HD 2932'],days:[105,110],source:WHEAT_SOURCE,conditions:'Central Zone, late sown, irrigated'},
      {variety:'HI 8638 (Malavkranti)',aliases:['HI 8638'],days:[120,125],source:WHEAT_SOURCE,conditions:'Central Zone, early sown, rainfed / restricted irrigation'},
      {variety:'HI 1531 (Harshita)',aliases:['HI 1531'],days:[130,135],source:WHEAT_SOURCE,conditions:'Central Zone, early sown, rainfed / restricted irrigation'},
    ];
    case 'chickpea':return [
      {variety:'Pusa JG 16',days:[110,110],source:PUSA_GRAM_SOURCE,conditions:'Central Zone, drought-stress trials; distinct from JG 16'},
      {variety:'IPCK 2002-29 (Shubhra)',aliases:['IPCK 2002-29'],days:[105,115],source:GRAM_SOURCE,conditions:'Central Zone, timely sown, irrigated'},
      {variety:'IPCK 2004-29 (Ujjawal)',aliases:['IPCK 2004-29'],days:[105,115],source:GRAM_SOURCE,conditions:'Central Zone, timely sown, irrigated'},
      {variety:'IPC 2006-77',days:[115,120],source:GRAM_SOURCE,conditions:'Central Zone, late sown, irrigated'},
    ];
    default:return [];
  }
}
export function maturityEstimate(field: Pick<Field,'region'>, cycle: Pick<CropCycle,'crop'|'season'|'variety'|'sowing_date'>) {
  const crop=marketCrop(cycle.crop),season=crop==='soybean'?'kharif':'rabi';
  if (!crop || !field.region || !/^([^,]+,\s*)?madhya pradesh$/i.test(field.region.trim()) || cycle.season?.toLowerCase() !== season || !cycle.sowing_date) return null;
  validateDate(cycle.sowing_date);
  const normal = (v:string)=>v.toUpperCase().replace(/[^A-Z0-9]/g,'');
  const entry = maturityEntries(cycle.crop).find(v=>[v.variety,...(v.aliases??[])].some(name=>normal(name)===normal(cycle.variety??'')));
  if (!entry) return null;
  return {...entry,start:addDays(cycle.sowing_date,entry.days[0]),end:addDays(cycle.sowing_date,entry.days[1])};
}
export type SeasonMark = {date:string;label:string;kind:'sowing'|'maturity'|'reminder'|'rain'|'check';detail?:string;done?:boolean};
export function planningChecks(field:Pick<Field,'region'>,cycle:CropCycle,weeks=20):SeasonMark[] {
  if(!cycle.sowing_date||!marketCrop(cycle.crop)||!Number.isInteger(weeks)||weeks<1||weeks>30)return [];
  validateDate(cycle.sowing_date);
  const end=maturityEstimate(field,cycle)?.end??addDays(cycle.sowing_date,weeks*7);
  const marks:SeasonMark[]=[{date:cycle.sowing_date,label:'Soil & manure plan review',kind:'check',detail:'Planning checkpoint: review your soil report and any existing advisor-approved manure plan. This does not schedule an application or prescribe an amount.'}];
  for(let n=1;n<=weeks;n++) {
    const date=addDays(cycle.sowing_date,n*7);if(date>end)break;
    marks.push({date,label:n%4===0?'Crop nutrition & pest review':'Field check: pests, weeds & moisture',kind:'check',detail:n%4===0?'Record crop appearance, soil-test gaps and pest observations; discuss treatment or manure needs with your local advisor. No automatic spraying or manure application is assigned.':'Record actual crop stage, pest counts or visible damage, weeds, drainage and field moisture. A check date does not establish a growth stage or a need to spray.'});
  }
  return marks;
}
export function seasonMarks(field: Pick<Field,'region'>, cycle: CropCycle, tasks: CalendarTask[], weather: Weather|null,weeks=20): SeasonMark[] {
  const marks:SeasonMark[] = [];
  if (cycle.sowing_date) marks.push({date:cycle.sowing_date,label:'Sowing date',kind:'sowing'});
  const maturity = maturityEstimate(field,cycle);
  if (maturity) for (let date=maturity.start;date<=maturity.end;date=addDays(date,1)) marks.push({date,label:'Estimated maturity / harvest planning',kind:'maturity'});
  marks.push(...planningChecks(field,cycle,weeks));
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

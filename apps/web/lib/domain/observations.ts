import { validateDate, type FarmData, type Meta } from './farm.ts';

export const OBSERVATION_TAGS = ['Leaf colour change','Spots or marks','Wilting','Insects seen','Growth change','Other'] as const;
export type ObservationTag = typeof OBSERVATION_TAGS[number];
export type Observation = Meta & {cycle_id:string; date:string; note:string; tags:ObservationTag[]; scan_summary_id:string|null};
export function validateObservation(value:unknown):Observation {
  const fail=(message:string):never=>{throw new Error(`${message} No records were changed.`);};
  if(!value || typeof value !== 'object' || Array.isArray(value))fail('Expected an observation.');
  const v=value as Record<string,unknown>;
  const text=(s:unknown,max=120):string=>{if(typeof s !== 'string' || !s.trim() || s.length>max)fail('Invalid observation text.');return s as string;};
  const time=(s:unknown):string=>{const t=text(s,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(t) || !Number.isFinite(Date.parse(t)) || new Date(t).toISOString().slice(0,19)!==t.slice(0,19))fail('Invalid observation time.');return t;};
  const created_at=time(v.created_at),updated_at=time(v.updated_at),date=validateDate(v.date);
  if(v.schema_version!==1 || !['user','demo','import'].includes(v.origin as string) || Date.parse(updated_at)<Date.parse(created_at) || !date)fail('Invalid observation metadata or date.');
  if(!Array.isArray(v.tags) || v.tags.length>OBSERVATION_TAGS.length || v.tags.some(t=>!OBSERVATION_TAGS.includes(t as ObservationTag)) || new Set(v.tags).size!==v.tags.length)fail('Choose distinct supported observation tags.');
  return {id:text(v.id),schema_version:1,created_at,updated_at,origin:v.origin as Meta['origin'],cycle_id:text(v.cycle_id),date:date!,note:text(v.note,1000),tags:[...v.tags as ObservationTag[]],scan_summary_id:v.scan_summary_id===null ? null : text(v.scan_summary_id)};
}
export function isSyntheticObservation(data:FarmData,observation:Observation):boolean {
  const cycle=data.cycles.find(c=>c.id===observation.cycle_id),field=data.fields.find(f=>f.id===cycle?.field_id),farm=data.farms.find(f=>f.id===field?.farm_id);
  const scan=data.scans.find(s=>s.id===observation.scan_summary_id);
  return [observation,cycle,field,farm,scan].some(r=>r?.origin==='demo') || scan?.availability==='simulation';
}
export function observationHistory(data:FarmData,cycleId:string,demo:boolean):Observation[] {
  return data.observations.filter(o=>o.cycle_id===cycleId && isSyntheticObservation(data,o)===demo).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
}
// Keep notes when a screening is deleted, and keep their synthetic provenance.
export function removeScan(data:FarmData,id:string,now=new Date().toISOString()):FarmData {
  return {...data,scans:data.scans.filter(s=>s.id!==id),observations:data.observations.map(o=>o.scan_summary_id===id ? {...o,scan_summary_id:null,updated_at:now,origin:isSyntheticObservation(data,o) ? 'demo' : o.origin} : o)};
}

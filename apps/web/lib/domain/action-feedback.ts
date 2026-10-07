import { newMeta, validateDate, todayInZone, type FarmData, type Meta } from './farm.ts';
import type { NextStep } from '../recommendations/next-steps.ts';
import { validateTask } from './calendar.ts';

export const FEEDBACK_VERSION='preparation-1' as const;
export const FEEDBACK_STATES=['pending','done','snoozed','not_applicable','needs_help'] as const;
export type FeedbackState=typeof FEEDBACK_STATES[number];
export type ActionFeedback=Meta & {field_id:string;cycle_id:string|null;step_id:string;generator_version:typeof FEEDBACK_VERSION;input_key:string;title:string;state:FeedbackState;snooze_until:string|null;note:string|null};
const STEP_IDS=['cycle','coverage','water','weather','weather-review','sowing','stage','diary','soil-record','soil-review'];
function supported(id:string){return STEP_IDS.includes(id) || (/^(task|anchor):[\s\S]{1,120}$/.test(id) && !!id.slice(id.indexOf(':')+1).trim());}
export function validateFeedback(value:unknown):ActionFeedback {
  const fail=(message:string):never=>{throw new Error(`${message} No feedback was saved.`);};
  if(!value || typeof value!=='object' || Array.isArray(value))fail('Expected feedback.');
  const v=value as Record<string,unknown>;
  const text=(s:unknown,max=120):string=>{if(typeof s!=='string' || !s.trim() || s.length>max)fail('Invalid feedback text.');return s as string;};
  const time=(s:unknown):string=>{const t=text(s,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(t) || !Number.isFinite(Date.parse(t)) || new Date(t).toISOString().slice(0,19)!==t.slice(0,19))fail('Invalid feedback time.');return t;};
  const created_at=time(v.created_at),updated_at=time(v.updated_at),step_id=text(v.step_id,128),field_id=text(v.field_id),cycle_id=v.cycle_id===null ? null : text(v.cycle_id);
  if(v.schema_version!==1 || !['user','demo','import'].includes(v.origin as string) || Date.parse(updated_at)<Date.parse(created_at) || v.generator_version!==FEEDBACK_VERSION || !supported(step_id) || !FEEDBACK_STATES.includes(v.state as FeedbackState))fail('Invalid feedback metadata, step or state.');
  const input_key=text(v.input_key,8000);
  let key:unknown;try{key=JSON.parse(input_key);}catch{fail('Invalid feedback input key.');}
  if(!Array.isArray(key) || key.length!==13 || key[0]!==FEEDBACK_VERSION || key[1]!== (v.origin==='demo') || key[2]!==step_id || key[3]!==field_id || key[4]!==cycle_id || JSON.stringify(key)!==input_key)fail('Feedback input key does not match its scope.');
  const parts=key as unknown[];
  time(parts[5]);if(parts[6]!==null)time(parts[6]);
  if(parts[7]!==v.title)fail('Feedback title does not match its input key.');
  text(parts[7],180);text(parts[8],2000);text(parts[10],120);
  if(!Array.isArray(parts[9]) || parts[9].length>12)fail('Invalid feedback input descriptions.');
  (parts[9] as unknown[]).forEach(input=>text(input,500));
  if(parts[11]!==null){
    const task=parts[11];if(!Array.isArray(task) || task.length!==3 || cycle_id===null)fail('Invalid reminder input key.');
    const tuple=task as unknown[],stamp=time(tuple[1]),schedule=text(tuple[2],300);
    let rawSchedule:unknown;try{rawSchedule=JSON.parse(schedule);}catch{fail('Invalid reminder schedule in feedback.');}
    const normalized=validateTask({id:text(tuple[0]),schema_version:1,created_at:stamp,updated_at:stamp,origin:'user',cycle_id,title:'Feedback input',status:'pending',completed_at:null,schedule:rawSchedule});
    if(JSON.stringify(normalized.schedule)!==schedule)fail('Unsupported reminder fields in feedback.');
  }
  if(parts[12]!==null){const soil=parts[12];if(!Array.isArray(soil) || soil.length!==2)fail('Invalid soil input key.');text((soil as unknown[])[0]);time((soil as unknown[])[1]);}
  const snooze_until=validateDate(v.snooze_until);
  if(v.state==='snoozed' ? !snooze_until : snooze_until!==null)fail('Snoozed feedback needs a date; other states cannot have one.');
  if(cycle_id===null && /^(task:|anchor:|sowing$|stage$|diary$)/.test(step_id))fail('This feedback requires a crop cycle.');
  return {id:text(v.id),schema_version:1,created_at,updated_at,origin:v.origin as Meta['origin'],field_id,cycle_id,step_id,generator_version:FEEDBACK_VERSION,input_key,title:text(v.title,180),state:v.state as FeedbackState,snooze_until,note:v.note===null ? null : text(v.note,500)};
}
export function feedbackIsDemo(data:FarmData,fieldId:string,cycleId:string|null,stepId:string):boolean {
  const field=data.fields.find(f=>f.id===fieldId),cycle=data.cycles.find(c=>c.id===cycleId),farm=data.farms.find(f=>f.id===field?.farm_id);
  const task=/^(task|anchor):/.test(stepId) ? data.tasks.find(t=>t.id===stepId.slice(stepId.indexOf(':')+1)) : undefined;
  return [field,cycle,farm,task].some(r=>r?.origin==='demo');
}
export function feedbackKey(data:FarmData,fieldId:string,cycleId:string|null,step:NextStep):string {
  const field=data.fields.find(f=>f.id===fieldId),cycle=data.cycles.find(c=>c.id===cycleId);
  if(!field || (cycleId!==null && (!cycle || cycle.field_id!==fieldId)))throw new Error('Feedback field/cycle selection is invalid.');
  const task=/^(task|anchor):/.test(step.id) ? data.tasks.find(t=>t.id===step.id.slice(step.id.indexOf(':')+1) && t.cycle_id===cycleId) : undefined;
  const soil=step.id.startsWith('soil-') ? data.soil_tests.filter(s=>s.field_id===fieldId && s.origin!=='demo').sort((a,b)=>b.sample_date.localeCompare(a.sample_date)||a.id.localeCompare(b.id))[0] : undefined;
  // Exact card content and source revisions; coordinates and photo data are never copied.
  return JSON.stringify([FEEDBACK_VERSION,feedbackIsDemo(data,fieldId,cycleId,step.id),step.id,fieldId,cycleId,field.updated_at,cycle?.updated_at ?? null,step.title,step.why,step.inputs,step.id.startsWith('task:') ? 'Personal reminder' : step.timing,task ? [task.id,task.updated_at,JSON.stringify(task.schedule)] : null,soil ? [soil.id,soil.updated_at] : null]);
}
export function matchingFeedback(data:FarmData,fieldId:string,cycleId:string|null,step:NextStep):ActionFeedback|null {
  const key=feedbackKey(data,fieldId,cycleId,step);
  return data.feedback.find(f=>f.field_id===fieldId && f.cycle_id===cycleId && f.step_id===step.id && f.input_key===key) ?? null;
}
export function feedbackActive(feedback:ActionFeedback|null,today:string):boolean {
  return !feedback || feedback.state==='pending' || feedback.state==='needs_help' || (feedback.state==='snoozed' && feedback.snooze_until!<=today);
}
export type FeedbackChange={state:FeedbackState;snooze_until:string|null;note:string|null;input_key:string};
export function recordFeedback(data:FarmData,fieldId:string,cycleId:string|null,step:NextStep,change:FeedbackChange,now=new Date().toISOString()):FarmData {
  if(/^(task|anchor):/.test(step.id) && !data.tasks.some(t=>t.id===step.id.slice(step.id.indexOf(':')+1) && t.cycle_id===cycleId && t.status==='pending'))throw new Error('This personal reminder is no longer pending in the selected cycle.');
  const key=feedbackKey(data,fieldId,cycleId,step);
  if(key!==change.input_key)throw new Error('Suggestion inputs changed. Review the current step before saving feedback.');
  const field=data.fields.find(f=>f.id===fieldId)!,farm=data.farms.find(f=>f.id===field.farm_id)!;
  if(change.state==='snoozed' && (!change.snooze_until || change.snooze_until<=todayInZone(farm.timezone,new Date(now))))throw new Error('Choose a snooze date after today in your farm timezone.');
  const previous=matchingFeedback(data,fieldId,cycleId,step),demo=feedbackIsDemo(data,fieldId,cycleId,step.id);
  const record=validateFeedback({...(previous ?? newMeta(now)),updated_at:now,origin:demo ? 'demo' : previous?.origin==='import' ? 'import' : 'user',field_id:fieldId,cycle_id:cycleId,step_id:step.id,generator_version:FEEDBACK_VERSION,input_key:key,title:step.title,state:change.state,snooze_until:change.snooze_until,note:change.note});
  return {...data,feedback:[...data.feedback.filter(f=>f.id!==record.id),record]};
}

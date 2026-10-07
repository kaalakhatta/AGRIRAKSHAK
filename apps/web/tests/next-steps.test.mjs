import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendNextSteps } from '../lib/recommendations/next-steps.ts';
const base = () => ({field:{id:'f',name:'Field',region:null,water:'unknown'},cycle:{id:'c',field_id:'f',crop:'Test crop',season:null,variety:null,status:'active',stage:null,sowing_date:null},tasks:[],weather:null,hasLocation:false,today:'2026-10-06',now:Date.parse('2026-10-06T10:00:00Z')});
test('missing records produce actionable explainable steps without invented crop advice',()=>{
 const input=base(),before=JSON.stringify(input),steps=recommendNextSteps(input);
 assert.deepEqual(steps.map(s=>s.id),['coverage','water','weather','sowing','stage','diary','soil-record']);
 assert.ok(steps.every(s=>s.inputs.length && s.why && s.href));assert.equal(JSON.stringify(input),before);
 assert.match(steps.find(s=>s.id==='coverage').why,/region, season, variety/);
});
test('personal due tasks lead, completed and other-cycle tasks are excluded',()=>{
 const input=base();input.tasks=[{id:'due',cycle_id:'c',title:'My check',status:'pending',schedule:{kind:'date',date:'2026-10-05'}},{id:'done',cycle_id:'c',status:'done',schedule:{kind:'date',date:'2026-10-05'}},{id:'other',cycle_id:'other',status:'pending',schedule:{kind:'date',date:'2026-10-05'}}];
 const steps=recommendNextSteps(input);assert.equal(steps[0].id,'task:due');assert.equal(steps[0].timing,'Overdue');assert.ok(!steps.some(s=>s.id==='task:done'||s.id==='task:other'));
});
test('a foreign cycle cannot populate field recommendations',()=>{
 const input=base();input.cycle.field_id='other';const steps=recommendNextSteps(input);
 assert.ok(steps.some(s=>s.id==='cycle'));assert.ok(!steps.some(s=>['sowing','stage','diary'].includes(s.id)));assert.ok(!JSON.stringify(steps).includes('Test crop'));
});
test('fresh estimates preserve unknown values; stale data asks for refresh, not field action',()=>{
 const input=base();input.hasLocation=true;input.weather={schema_version:'weather-1',fetched_at:'2026-10-06T10:00:00Z',observed_at:'2026-10-06T10:00:00Z',issued_at:null,interval_seconds:900,timezone:'GMT',current:{temperature:null,precipitation:0,humidity:null,wind:null},days:[]};
 let step=recommendNextSteps(input).find(s=>s.id.startsWith('weather'));assert.equal(step.id,'weather-review');assert.match(step.why,/temperature unavailable/);assert.match(step.why,/0 mm over 15 minutes/);
 input.now+=86400000;step=recommendNextSteps(input).find(s=>s.id.startsWith('weather'));assert.equal(step.id,'weather');assert.match(step.title,/Refresh/);
});

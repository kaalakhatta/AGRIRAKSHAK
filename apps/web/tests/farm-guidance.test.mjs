import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData } from '../lib/domain/farm.ts';
import { farmGuidance, targetCrop, targetRegion } from '../lib/recommendations/farm-guidance.ts';

const time = '2026-10-08T06:00:00.000Z', now = Date.parse(time);
const meta = id => ({id, schema_version:1, created_at:time, updated_at:time, origin:'user'});
const records = () => ({...emptyData(), revision:1,
  farms:[{...meta('farm'),name:'Fixture',language:'en',timezone:'Asia/Kolkata'}],
  fields:[{...meta('field'),farm_id:'farm',name:'Fixture',region:'Sehore, Madhya Pradesh',water:'rainfed',area:null,location:null}],
  cycles:[{...meta('cycle'),field_id:'field',crop:'Soyabean',season:'kharif',variety:null,status:'active',sowing_date:null,stage:'vegetative',stage_recorded_at:time}]
});
// Fake content proves the integration gate; never included in the runtime catalog.
const requirement = (input, unit='text', kinds=['user'], max_age_seconds=null) => ({input,unit,kinds,max_age_seconds});
const catalog = () => ({schema_version:'engine-1',version:'synthetic-test-only',evidence:[{id:'fixture',url:'https://example.invalid/fixture',verified:true}],rules:[{
  id:'fixture',version:'1',title:'Synthetic fixture title',action:'Synthetic fixture action',
  review:{status:'reviewed',reviewer:'Synthetic test reviewer',reviewed_at:time},evidence:['fixture'],
  applicability:{crop:['soybean'],region:['IN-MP-SEHORE'],season:['kharif']},
  required_inputs:['crop','region','season'].map(key=>requirement(key)),
  condition:{op:'exists',input:'crop'},contraindications:[],conflict_group:null
}]});
const run = (s=records(),c=catalog(),w=null,n=now) => farmGuidance(s,'field','cycle',n,w,c);
const withInput = (key,unit,kinds,age=null) => {
  const c=catalog();c.rules[0].required_inputs.push(requirement(key,unit,kinds,age));
  c.rules[0].condition={op:'exists',input:key};return c;
};
const weather = () => ({field_id:'field',weather:{schema_version:'weather-1',fetched_at:time,observed_at:time,issued_at:null,interval_seconds:900,timezone:'GMT',current:{temperature:0,humidity:null,precipitation:0,wind:0},days:[]}});

test('explicit crop/region aliases match; fuzzy and prototype inputs do not establish coverage',()=>{
  for(const value of ['soybean',' SOYABEAN ','wheat','gram','chickpea','gram/chickpea','chana']) assert.ok(targetCrop(value));
  for(const value of ['black gram','wheatgrass','soybean infected','constructor','toString',null]) assert.equal(targetCrop(value),null);
  for(const value of ['Sehore','Sehore, MP','Madhya Pradesh, Sehore','IN-MP-SEHORE']) assert.equal(targetRegion(value),true);
  for(const value of ['Madhya Pradesh','Sehore, Rajasthan','near Sehore','Bhopal',null]) assert.equal(targetRegion(value),false);
});
test('empty runtime abstains, while reviewed synthetic fixture proves explainable integration without mutation',()=>{
  const s=records(),c=catalog(),before=structuredClone({s,c});
  const empty=farmGuidance(s,'field','cycle',now);
  assert.equal(empty.status,'awaiting_review');assert.deepEqual(empty.actions,[]);
  const result=run(s,c);assert.equal(result.actions.length,1);assert.match(result.actions[0].reviewer,/Synthetic/);
  assert.deepEqual(result.actions[0].evidence,['https://example.invalid/fixture']);assert.deepEqual({s,c},before);
});
test('foreign cycle, absent parent, missing district and outside focus abstain',()=>{
  const s=records();s.cycles[0].field_id='other';assert.equal(run(s).status,'needs_input');
  const missing=records();missing.farms=[];assert.equal(run(missing).status,'needs_input');
  for(const region of [null,'Madhya Pradesh']) {const x=records();x.fields[0].region=region;assert.equal(run(x).status,'needs_input');}
  const x=records();x.fields[0].region='Bhopal';assert.equal(run(x).status,'outside_focus');
  x.fields[0].region='Sehore';x.cycles[0].crop='Tomato';assert.equal(run(x).status,'outside_focus');
});
test('demo origin on any parent blocks actions even if the cycle itself is real',()=>{
  for(const tree of ['farms','fields','cycles']) {const s=records();s[tree][0].origin='demo';assert.equal(run(s).status,'demo');assert.deepEqual(run(s).actions,[]);}
});
test('unknown season is not inferred and unscoped rules never produce actions',()=>{
  const s=records();s.cycles[0].season=null;assert.equal(run(s).decisions[0].status,'needs_input');
  for(const key of ['crop','region','season']) {const c=catalog();delete c.rules[0].applicability[key];assert.deepEqual(run(records(),c).actions,[]);}
});
test('draft/rejected/missing-reviewer/unverified evidence cannot expose action text',()=>{
  for(const status of ['draft','rejected']) {const c=catalog();c.rules[0].review.status=status;const result=run(records(),c);assert.equal(result.decisions[0].status,'unreviewed');assert.deepEqual(result.actions,[]);assert.ok(!JSON.stringify(result).includes('Synthetic fixture action'));}
  const c=catalog();c.rules[0].review.reviewer=null;assert.deepEqual(run(records(),c).actions,[]);
  c.rules[0].review.reviewer='Fixture';c.evidence[0].verified=false;assert.deepEqual(run(records(),c).actions,[]);
});
test('zero weather estimates remain zero; null/foreign/stale/future estimates do not support actions',()=>{
  const c=withInput('air_temperature','degC',['weather_estimate'],60);c.rules[0].condition={op:'eq',input:'air_temperature',value:0};
  assert.equal(run(records(),c,weather()).actions.length,1);
  const missing=weather();missing.weather.current.temperature=null;assert.deepEqual(run(records(),c,missing).actions,[]);
  const foreign=weather();foreign.field_id='other';assert.deepEqual(run(records(),c,foreign).actions,[]);
  const stale=weather();stale.weather.observed_at='2026-10-08T05:00:00.000Z';assert.deepEqual(run(records(),c,stale).actions,[]);
  const future=weather();future.weather.observed_at='2026-10-08T07:00:00.000Z';assert.deepEqual(run(records(),c,future).actions,[]);
  assert.equal(run(records(),c,weather(),now+60_000).decisions[0].status,'stale');
});
test('stage freshness uses confirmation time and unknown water remains unknown',()=>{
  const s=records();s.cycles[0].stage_recorded_at='2026-10-08T05:00:00.000Z';
  assert.equal(run(s,withInput('stage','text',['user'],60)).decisions[0].status,'stale');
  s.cycles[0].stage_recorded_at=null;assert.equal(run(s,withInput('stage','text',['user'],60)).decisions[0].status,'needs_input');
  s.fields[0].water='unknown';assert.equal(run(s,withInput('water_availability','text',['user'])).decisions[0].status,'needs_input');
});
test('forecast, soil and disease confidence are not fabricated from records or coordinates',()=>{
  const s=records();s.fields[0].location={latitude:23,longitude:77,accuracy_m:null,method:'manual',confirmed_at:time};
  for(const [key,unit,kind] of [['soil_ph','pH','soil_lab'],['forecast_temperature','degC','forecast'],['disease_confidence','percent','user']]) assert.equal(run(s,withInput(key,unit,[kind]),weather()).decisions[0].status,'needs_input');
});
test('conflicts, invalid catalog and absent clock abstain',()=>{
  const c=catalog();c.rules[0].conflict_group='fixture';c.rules.push({...structuredClone(c.rules[0]),id:'competing'});
  assert.deepEqual(run(records(),c).actions,[]);assert.ok(run(records(),c).decisions.every(d=>d.status==='blocked'));
  assert.equal(run(records(),{schema_version:'bad'}).status,'unavailable');assert.equal(run(records(),c,null,0).status,'unavailable');
});

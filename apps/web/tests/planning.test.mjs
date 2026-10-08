import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyData } from '../lib/domain/farm.ts';
import { EMPTY_PLANNING_CATALOG, planGuidance, validatePlanningCatalog } from '../lib/recommendations/planning.ts';

const time='2026-10-08T06:00:00.000Z',now=Date.parse(time);
const meta=id=>({id,schema_version:1,created_at:time,updated_at:time,origin:'user'});
const records=()=>({...emptyData(),revision:1,
  farms:[{...meta('farm'),name:'Synthetic fixture',language:'en',timezone:'Asia/Kolkata'}],
  fields:[{...meta('field'),farm_id:'farm',name:'Synthetic fixture',region:'Sehore',area:null,water:'rainfed',location:null}],
  cycles:[{...meta('cycle'),field_id:'field',crop:'Soybean',variety:null,season:'Kharif',status:'active',sowing_date:'2026-10-07',stage:'vegetative',stage_recorded_at:time}]
});
const req=(input,max_age_seconds=null)=>({input,unit:'text',kinds:['user'],max_age_seconds});
// Deliberately synthetic crop facts, reviewer and timing; no fixture ships as advice.
const rule=id=>({id,version:'fixture-1',title:'Synthetic title',action:'Synthetic action',review:{status:'reviewed',reviewer:'Synthetic reviewer',reviewed_at:time},evidence:['synthetic'],applicability:{crop:['soybean'],region:['IN-MP-SEHORE'],season:['kharif']},required_inputs:['crop','region','season'].map(input=>req(input)),condition:{op:'exists',input:'crop'},contraindications:[],conflict_group:null});
const seed=(id,name)=>({rule:{...rule(id),required_inputs:[...rule(id).required_inputs,req('water_availability')],condition:{op:'eq',input:'water_availability',value:'rainfed'}},variety_id:id,name,variety_name:name,facts:[{key:'fixture',label:'Synthetic comparison',value:'Synthetic fact',evidence:['synthetic']}],cautions:['Synthetic caution']});
const catalog=()=>{
  const a=seed('seed-z','Z fixture'),b=seed('seed-a','A fixture');delete a.name;delete b.name;
  const stageRule=rule('stage');stageRule.required_inputs.push(req('stage',3600));
  return {schema_version:'planning-1',version:'synthetic-test-only',evidence:[{id:'synthetic',url:'https://example.invalid/fixture',verified:true,claim:'Synthetic claim',accessed_on:'2026-10-08',license:'Synthetic test only'}],seeds:[a,b],calendar:[{rule:rule('date'),timing:{kind:'sowing',start_day:1,end_day:3},cautions:[]},{rule:stageRule,timing:{kind:'stage',stage:'vegetative'},cautions:[]}]};
};
const run=(s=records(),c=catalog(),clock=now)=>planGuidance(s,'field','cycle',clock,null,c);
const reject=edit=>{const c=catalog();edit(c);assert.throws(()=>validatePlanningCatalog(c),/Unsupported/);assert.equal(run(records(),c).status,'unavailable');};

test('reviewed fixture yields unranked sourced comparisons and correctly anchored previews without mutations',()=>{
  const s=records(),c=catalog(),before=structuredClone({s,c}),result=run(s,c);
  assert.deepEqual(result.seeds.map(seed=>seed.name),['A fixture','Z fixture']);
  assert.deepEqual(result.seeds[0].facts[0].evidence,['https://example.invalid/fixture']);assert.equal(result.seeds[0].reviewer,'Synthetic reviewer');
  assert.ok(result.seeds[0].inputs.includes('water_availability'));assert.ok(!Object.hasOwn(result.seeds[0],'score'));
  assert.equal(result.calendar[0].start_date,'2026-10-08');assert.equal(result.calendar[0].end_date,'2026-10-10');assert.equal(result.calendar[0].timing_label,'Within reviewed date window');
  assert.equal(result.calendar[1].stage,'vegetative');assert.equal(result.calendar[1].start_date,null);assert.deepEqual({s,c},before);
});
test('bundled empty catalog matches the authoring template and never produces advice',()=>{
  const empty=JSON.parse(readFileSync(new URL('../../../data/catalog/farm-context/planning.empty.json',import.meta.url)));
  assert.deepEqual(validatePlanningCatalog(empty),EMPTY_PLANNING_CATALOG);
  const result=run(records(),empty);assert.equal(result.status,'awaiting_review');assert.deepEqual(result.seeds,[]);assert.deepEqual(result.calendar,[]);
});
test('draft, rejected, absent reviewer, unverified evidence and future verification suppress content',()=>{
  for(const status of ['draft','rejected']) {
    const c=catalog();for(const entry of [...c.seeds,...c.calendar])entry.rule.review.status=status;
    const result=run(records(),c);assert.deepEqual(result.seeds,[]);assert.deepEqual(result.calendar,[]);assert.ok(!JSON.stringify(result).includes('Synthetic fact'));assert.ok(!JSON.stringify(result).includes('Synthetic action'));
  }
  for(const edit of [c=>c.seeds[0].rule.review.reviewer=null,c=>c.evidence[0].verified=false,c=>c.evidence[0].accessed_on='2026-10-09',c=>c.seeds[0].rule.review.reviewed_at='2026-10-09T06:00:00Z']) {const c=catalog();edit(c);assert.ok(!run(records(),c).seeds.some(seed=>seed.id==='seed-z'));}
});
test('missing water or wrong season blocks affected seeds and soil cannot be inferred',()=>{
  const s=records();s.fields[0].water='unknown';const result=run(s);assert.deepEqual(result.seeds,[]);assert.equal(result.calendar.length,2);
  s.fields[0].water='rainfed';s.cycles[0].season=null;assert.deepEqual(run(s).seeds,[]);assert.deepEqual(run(s).calendar,[]);
  s.cycles[0].season='rabi';assert.deepEqual(run(s).seeds,[]);
  const c=catalog();c.seeds[0].rule.required_inputs.push({input:'soil_ph',unit:'pH',kinds:['soil_lab'],max_age_seconds:null});
  s.cycles[0].season='kharif';assert.ok(!run(s,c).seeds.some(seed=>seed.id==='seed-z'));assert.ok(run(s,c).seeds.some(seed=>seed.id==='seed-a'));
});
test('foreign cycle, outside focus, demo parents and completed seasons never produce plans',()=>{
  for(const edit of [s=>s.cycles[0].field_id='foreign',s=>s.fields[0].region='Bhopal',s=>s.cycles[0].crop='Tomato',s=>s.cycles[0].status='harvested',s=>s.cycles[0].status='archived',s=>s.farms[0].origin='demo',s=>s.fields[0].origin='demo',s=>s.cycles[0].origin='demo']) {const s=records();edit(s);const result=run(s);assert.deepEqual(result.seeds,[]);assert.deepEqual(result.calendar,[]);}
});
test('unknown sowing suppresses dated templates while confirmed stage may still appear',()=>{
  const s=records();s.cycles[0].sowing_date=null;const result=run(s);
  assert.deepEqual(result.calendar.map(entry=>entry.id),['stage']);assert.equal(result.decisions.find(d=>d.id==='date').status,'needs_input');
  s.cycles[0].stage_recorded_at=null;assert.deepEqual(run(s).calendar,[]);
});
test('stage confirmation is checked for mismatch, future time and reviewed freshness',()=>{
  for(const edit of [s=>s.cycles[0].stage=null,s=>s.cycles[0].stage='flowering',s=>s.cycles[0].stage_recorded_at='2026-10-08T07:00:00Z',s=>s.cycles[0].stage_recorded_at='2026-10-08T05:00:00Z']) {const s=records();edit(s);assert.ok(!run(s).calendar.some(entry=>entry.id==='stage'));}
  const c=catalog();c.calendar[1].rule.required_inputs.find(r=>r.input==='stage').max_age_seconds=null;assert.throws(()=>validatePlanningCatalog(c),/Unsupported/);
});
test('future and passed date windows use local farm date; no overdue catch-up advice',()=>{
  const s=records();s.cycles[0].sowing_date='2026-10-10';assert.equal(run(s).calendar[0].timing_label,'Upcoming reviewed date window');
  s.cycles[0].sowing_date='2026-10-01';assert.ok(!run(s).calendar.some(entry=>entry.id==='date'));assert.match(run(s).decisions.find(d=>d.id==='date').reasons[0],/passed/);
  const c=catalog();c.calendar[0].timing={kind:'sowing',start_day:0,end_day:0};s.cycles[0].sowing_date='2026-10-08';
  const clock=Date.parse('2026-10-07T20:00:00Z');s.farms[0].created_at=s.farms[0].updated_at=s.fields[0].created_at=s.fields[0].updated_at=s.cycles[0].created_at=s.cycles[0].updated_at='2026-10-07T18:00:00Z';
  for(const e of [...c.seeds,...c.calendar])e.rule.review.reviewed_at='2026-10-07T18:00:00Z';c.evidence[0].accessed_on='2026-10-07';
  assert.equal(run(s,c,clock).calendar.find(entry=>entry.id==='date').timing_label,'Within reviewed date window');
});
test('negative offsets and leap boundaries are arithmetic from the reviewed fixture only',()=>{
  const s=records(),c=catalog();s.cycles[0].sowing_date='2028-03-01';c.calendar[0].timing={kind:'sowing',start_day:-1,end_day:0};
  assert.equal(run(s,c).calendar[0].start_date,'2028-02-29');assert.equal(run(s,c).calendar[0].end_date,'2028-03-01');
});
test('duplicate IDs/varieties/facts, dangling evidence, extra metadata and missing coverage reject',()=>{
  reject(c=>c.calendar[0].rule.id=c.seeds[0].rule.id);reject(c=>c.seeds[0].variety_id=c.seeds[1].variety_id);
  reject(c=>c.seeds[0].facts.push(structuredClone(c.seeds[0].facts[0])));reject(c=>c.seeds[0].facts[0].evidence=['missing']);
  reject(c=>c.seeds[0].rank=1);reject(c=>c.calendar[0].dependencies=['anything']);reject(c=>delete c.seeds[0].rule.applicability.region);
  reject(c=>c.seeds[0].rule.required_inputs=c.seeds[0].rule.required_inputs.filter(req=>req.input!=='water_availability'));
});
test('unreviewed provenance changes, executable conditions, malformed timing and sources fail closed',()=>{
  reject(c=>c.seeds[0].rule.condition={op:'eval',code:'return true'});reject(c=>c.seeds[0].rule.required_inputs.find(r=>r.input==='water_availability').kinds=['sensor']);
  reject(c=>c.calendar[0].timing.end_day=-1);reject(c=>c.calendar[0].timing.start_day=0.5);reject(c=>c.calendar[0].timing.start_day=-3651);
  reject(c=>c.calendar[1].timing.stage='invented');reject(c=>c.evidence[0].accessed_on='2026-02-30');reject(c=>c.evidence[0].url='https://user:password@example.invalid/fixture');
  reject(c=>c.seeds[0].rule.review.reviewer=' ');reject(c=>c.seeds[0].rule.review.reviewed_at='2026-02-30T06:00:00Z');
});
test('conflicts suppress competing seed/calendar entries and invalid clocks stay unavailable',()=>{
  const c=catalog();c.seeds[0].rule.conflict_group='fixture';c.calendar[0].rule.conflict_group='fixture';
  const result=run(records(),c);assert.ok(!result.seeds.some(seed=>seed.id==='seed-z'));assert.ok(!result.calendar.some(entry=>entry.id==='date'));
  assert.equal(run(records(),c,NaN).status,'unavailable');assert.equal(run(records(),c,0).status,'unavailable');
});

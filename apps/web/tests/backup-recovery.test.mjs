import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { emptyData,makeBackup,planImport } from '../lib/domain/farm.ts';
import { checkBackup,recordCounts } from '../lib/domain/backup-check.ts';
import { recommendNextSteps } from '../lib/recommendations/next-steps.ts';
import { recordFeedback,feedbackKey } from '../lib/domain/action-feedback.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
const meta=id=>({id,schema_version:1,created_at:'2026-10-07T12:00:00.000Z',updated_at:'2026-10-07T12:00:00.000Z',origin:'demo'});
const fixture=()=>{const d={...emptyData(),farms:[{...meta('farm'),name:'Synthetic recovery farm',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Synthetic recovery field',region:null,area:null,water:'unknown',location:{latitude:0,longitude:0,accuracy_m:null,method:'manual',confirmed_at:meta('field').created_at}}],cycles:[{...meta('cycle'),field_id:'field',crop:'Synthetic crop',variety:null,status:'active',sowing_date:'2026-10-01',stage:null,stage_recorded_at:null,season:null}],observations:[{...meta('note'),cycle_id:'cycle',date:'2026-10-07',note:'Synthetic backup recovery fixture.',tags:['Other'],scan_summary_id:'screen'}]};
 d.tasks=[{...meta('task'),cycle_id:'cycle',title:'Synthetic check',status:'pending',completed_at:null,schedule:{kind:'date',date:'2026-10-08'}}];
 d.scans=[{...meta('screen'),cycle_id:'cycle',screened_at:meta('screen').created_at,model_version:'interface-mock-v1',availability:'simulation',demo_label:'Synthetic demonstration',predicted_class:null,confidence:null}];
 d.soil_tests=[{...meta('soil'),field_id:'field',sample_date:'2026-10-06',source_kind:'manual_test',source:'Synthetic test kit',depth_cm:null,readings:[{metric:'ph',value:6,unit:'pH',method:null}]}];
 d.expenses=[{...meta('expense'),cycle_id:'cycle',date:'2026-10-07',category:'Other',kind:'cost',amount_minor:1000,currency:'INR',note:'Synthetic cost'}];
 d.harvests=[{...meta('harvest'),cycle_id:'cycle',date:'2026-10-07',quantity:2,unit:'kg',harvested_area:null,note:'Synthetic picking'}];
 d.sales=[{...meta('sale'),cycle_id:'cycle',date:'2026-10-07',quantity:1,unit:'kg',gross_amount_minor:1000,currency:'INR',note:'Synthetic sale'}];
 const step=recommendNextSteps({field:d.fields[0],cycle:d.cycles[0],tasks:d.tasks,soilTests:d.soil_tests,weather:null,hasLocation:true,today:'2026-10-07',now:Date.parse(meta('x').created_at)}).find(s=>s.id==='coverage');
 const complete=recordFeedback(d,'field','cycle',step,{state:'needs_help',note:'Synthetic help note',snooze_until:null,input_key:feedbackKey(d,'field','cycle',step)},meta('x').created_at);complete.feedback[0].id='feedback';return complete;
};
test('backup checks validate content without changing device records; default export strips coordinates',async()=>{
 globalThis.indexedDB=new IDBFactory();const original=fixture(),saved=await saveFarm(original,0),before=JSON.stringify(original),checked=checkBackup(JSON.stringify(makeBackup(original)));assert.equal(checked.backup.includes_coordinates,false);assert.equal(checked.backup.data.fields[0].location,null);assert.equal(checked.counts.observations,1);assert.equal(JSON.stringify(original),before);assert.deepEqual(await loadFarm(),saved);assert.equal(recordCounts(saved).fields,1);
});
test('recovery into an empty device preserves every supported array and idempotent restore keeps existing records',async()=>{
 globalThis.indexedDB=new IDBFactory();const backup=checkBackup(JSON.stringify(makeBackup(fixture()))).backup;const empty=await loadFarm(),plan=planImport(empty,backup.data);const restored=await saveFarm(plan.merged,empty.revision);assert.deepEqual(recordCounts(restored),recordCounts(backup.data));for(const key of ['tasks','scans','soil_tests','expenses','harvests','sales','observations','feedback'])assert.deepEqual(restored[key],backup.data[key]);assert.equal(restored.observations[0].note,backup.data.observations[0].note);assert.equal(planImport(restored,backup.data).additions,0);assert.equal(planImport(restored,backup.data).conflicts.length,0);assert.deepEqual(await loadFarm(),restored);
});
test('invalid/future/private-flag backups reject inspection and preserve the existing database',async()=>{
 globalThis.indexedDB=new IDBFactory();const saved=await saveFarm(fixture(),0),valid=makeBackup(fixture(),true);for(const raw of ['{broken',' '.repeat(2*1024*1024+1),JSON.stringify({...valid,schema_version:9}),JSON.stringify({...valid,includes_coordinates:false}),JSON.stringify({...valid,data:{...valid.data,cycles:[]}})]){assert.throws(()=>checkBackup(raw));assert.deepEqual(await loadFarm(),saved);}
});
test('legacy checks normalize safely while restore conflicts still require a deliberate decision',()=>{
 const legacy=fixture();legacy.schema_version=7;delete legacy.feedback;const checked=checkBackup(JSON.stringify({schema_version:7,application_version:'farm-m4-v7',exported_at:meta('x').created_at,includes_coordinates:true,data:legacy}));assert.deepEqual(checked.backup.data.feedback,[]);const current=fixture(),changed=fixture();changed.observations[0].note='Changed synthetic note';const plan=planImport(current,changed);assert.equal(plan.conflicts.length,1);assert.equal(plan.merged.observations[0].note,current.observations[0].note);assert.equal(planImport(current,changed,'backup').merged.observations[0].note,changed.observations[0].note);
});

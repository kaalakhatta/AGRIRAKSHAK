import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { validateSoilTest } from '../lib/domain/soil.ts';
import { emptyData,validateData,makeBackup,parseBackup,planImport,removeField,removeCycle } from '../lib/domain/farm.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
import { recommendNextSteps } from '../lib/recommendations/next-steps.ts';
const meta=id=>({id,schema_version:1,created_at:'2026-10-06T20:00:00.000Z',updated_at:'2026-10-06T20:00:00.000Z',origin:'demo'});
const soil=(id='soil')=>({...meta(id),field_id:'field',sample_date:'2026-10-07',source_kind:'soil_lab',source:'Synthetic source',depth_cm:{top:0,bottom:15},readings:[{metric:'ph',value:6,unit:'pH',method:null},{metric:'organic_carbon',value:0,unit:'g_kg',method:'Synthetic method'}]});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Synthetic farm',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Synthetic field',region:null,area:null,water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Synthetic crop',variety:null,status:'planned',sowing_date:null,stage:null,stage_recorded_at:null,season:null}],soil_tests:[soil()]});
test('soil preserves zero and unknown method/depth; strips unapproved content without altering source',()=>{
 const input={...soil(),depth_cm:null,photo:'private',location:{latitude:0,longitude:0},script:'eval()'};
 const clean=validateSoilTest(input);assert.equal(clean.depth_cm,null);assert.equal(clean.readings[0].method,null);assert.equal(clean.readings[1].value,0);assert.ok(!('photo' in clean));assert.ok(!('location' in clean));assert.ok(!('script' in clean));assert.ok('photo' in input);
});
test('reject unsupported sources/metrics/units, missing values, duplicate properties and invalid depths',()=>{
 const invalid=[{source_kind:'soil_map'},{source:' '},{readings:[]},{sample_date:'2026-02-30'},{depth_cm:{top:15,bottom:0}},{depth_cm:{top:0,bottom:Infinity}},{readings:[{metric:'ph',value:15,unit:'pH',method:null}]},{readings:[{metric:'organic_carbon',value:2,unit:'percent',method:null}]},{readings:[{metric:'ph',value:null,unit:'pH',method:null}]},{readings:[{metric:'eval',value:2,unit:'pH',method:null}]},{readings:[{metric:['ph'],value:2,unit:'pH',method:null}]},{readings:[soil().readings[0],soil().readings[0]]}];
 for(const patch of invalid)assert.throws(()=>validateSoilTest({...soil(),...patch}));
 assert.throws(()=>validateSoilTest({...soil(),readings:[{metric:'sand',value:80,unit:'percent',method:null},{metric:'clay',value:30,unit:'percent',method:null}]}));
});
test('sample date uses field timezone and rejects future dates, post-creation samples and missing references',()=>{
 const d=data();assert.doesNotThrow(()=>validateData(d));d.farms[0].timezone='America/Los_Angeles';assert.throws(()=>validateData(d),/after the record/);d.farms[0].timezone='Asia/Kolkata';d.soil_tests[0].sample_date='2099-01-01';assert.throws(()=>validateData(d),/future/);d.soil_tests[0]=soil();d.soil_tests[0].field_id='missing';assert.throws(()=>validateData(d),/missing field/);d.soil_tests[0]=soil('field');assert.throws(()=>validateData(d),/Duplicate/);
});
test('all legacy envelopes migrate to v4 without losing records; old schemas cannot hide soil data',()=>{
 for(const [version,app] of [[1,'farm-m1-v1'],[2,'farm-m3-v2'],[3,'farm-m3-v3']]){
 const d=data();d.schema_version=version;delete d.soil_tests;if(version<3)delete d.scans;if(version<2)delete d.tasks;
 const b={schema_version:version,application_version:app,exported_at:meta('x').created_at,includes_coordinates:false,data:d};const upgraded=parseBackup(JSON.stringify(b));assert.equal(upgraded.schema_version,4);assert.deepEqual(upgraded.data.soil_tests,[]);assert.deepEqual(upgraded.data.cycles,d.cycles);assert.deepEqual(upgraded.data.scans,d.scans ?? []);assert.throws(()=>validateData({...d,soil_tests:[soil()]}));
 }
 const d=data();assert.throws(()=>validateData({...d,schema_version:5}));assert.throws(()=>parseBackup(JSON.stringify({...makeBackup(d),application_version:'farm-m3-v3'})));
});
test('soil backups round-trip and imports are idempotent with explicit conflict resolution',()=>{
 const d=data(),backup=makeBackup(d);assert.deepEqual(parseBackup(JSON.stringify(backup)).data.soil_tests,d.soil_tests);assert.equal(planImport(d,structuredClone(d)).additions,0);const incoming=structuredClone(d);incoming.soil_tests[0].readings[0].value=7;
 const pending=planImport(d,incoming);assert.equal(pending.conflicts.length,1);assert.equal(pending.merged.soil_tests[0].readings[0].value,6);assert.equal(planImport(d,incoming,'backup').merged.soil_tests[0].readings[0].value,7);assert.equal(d.soil_tests[0].readings[0].value,6);
});
test('cycle deletion keeps field soil; field deletion cascades only its own tests',()=>{
 const d=data();d.fields.push({...d.fields[0],id:'other'});d.soil_tests.push({...soil('other-soil'),field_id:'other'});assert.equal(removeCycle(d,'cycle').soil_tests.length,2);assert.deepEqual(removeField(d,'field').soil_tests.map(s=>s.id),['other-soil']);assert.equal(d.soil_tests.length,2);
});
test('soil persists with atomic v3 migration and rejects stale tab writes',async()=>{
 globalThis.indexedDB=new IDBFactory();const d=data(),legacy={...d,schema_version:3,revision:2};delete legacy.soil_tests;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(legacy,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const before=await loadFarm();assert.equal(before.schema_version,4);assert.deepEqual(before.soil_tests,[]);const saved=await saveFarm({...before,soil_tests:d.soil_tests},2);assert.deepEqual((await loadFarm()).soil_tests,d.soil_tests);await assert.rejects(saveFarm({...before,soil_tests:[]},2),/another tab/);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...saved,soil_tests:[{...soil(),field_id:'missing'}]},3),/missing field/);assert.deepEqual(await loadFarm(),saved);
});
test('preparation steps exclude synthetic/foreign soil and never make sample freshness or efficacy claims',()=>{
 const d=data(),input={field:d.fields[0],cycle:d.cycles[0],tasks:[],soilTests:d.soil_tests,weather:null,hasLocation:false,today:'2026-10-07',now:Date.parse(meta('x').created_at)};
 assert.ok(recommendNextSteps(input).some(s=>s.id==='soil-record'));input.soilTests=[{...soil(),origin:'user',field_id:'other'}];assert.ok(recommendNextSteps(input).some(s=>s.id==='soil-record'));
 input.soilTests=[{...soil(),origin:'user',sample_date:'2020-01-01'}];const step=recommendNextSteps(input).find(s=>s.id==='soil-review');assert.match(step.why,/2020-01-01/);assert.match(step.why,/No rule has confirmed/);assert.match(step.why,/unknown/);
});

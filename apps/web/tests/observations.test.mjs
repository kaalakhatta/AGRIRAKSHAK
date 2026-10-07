import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { validateObservation,isSyntheticObservation,observationHistory,removeScan } from '../lib/domain/observations.ts';
import { emptyData,validateData,makeBackup,parseBackup,planImport,removeCycle,removeField } from '../lib/domain/farm.ts';
import { seasonReview } from '../lib/domain/season-records.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
const meta=id=>({id,schema_version:1,created_at:'2026-10-06T20:00:00.000Z',updated_at:'2026-10-06T20:00:00.000Z',origin:'user'});
const note=(id='note')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',note:'Synthetic test note, not actual field data.',tags:['Spots or marks'],scan_summary_id:null});
const scan=(id='scan')=>({...meta(id),cycle_id:'cycle',screened_at:meta(id).created_at,model_version:'test-no-model',availability:'unavailable',demo_label:null,predicted_class:null,confidence:null});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Test fixture',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Test field',region:null,area:null,water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Test crop',variety:null,status:'planned',sowing_date:null,stage:null,stage_recorded_at:null,season:null}],scans:[scan()],observations:[note()]});

test('observations require bounded plain text, explicit valid dates and distinct supported tags; private extras strip',()=>{
 const n=note(),raw={...n,note:'<script>not executable</script>\nPlain text.',photo:'private',filename:'private',latitude:0,confidence:0.99,predicted_class:'disease'};const parsed=validateObservation(raw);assert.equal(parsed.note,raw.note);for(const key of ['photo','filename','latitude','confidence','predicted_class'])assert.ok(!(key in parsed));assert.deepEqual(parsed.tags,n.tags);
 for(const patch of [{note:''},{note:'  '},{note:'x'.repeat(1001)},{date:null},{date:'2026-02-30'},{tags:['Spots or marks','Spots or marks']},{tags:['confirmed disease']},{tags:null},{scan_summary_id:undefined},{updated_at:'2026-10-05T20:00:00.000Z'}])assert.throws(()=>validateObservation({...n,...patch}));assert.doesNotThrow(()=>validateObservation({...n,tags:[],note:'x'.repeat(1000)}));
});
test('observation dates use farm timezone, resolve cycle references and permit preplant field notes',()=>{
 const d=data();d.cycles[0].sowing_date='2099-01-01';assert.doesNotThrow(()=>validateData(d));
 for(const patch of [{cycle_id:'missing'},{id:'field'},{date:'2099-01-01'}])assert.throws(()=>validateData({...d,observations:[{...note(),...patch}]}));d.farms[0].timezone='America/Los_Angeles';assert.throws(()=>validateData(d),/entry creation/);
});
test('screening references require the same cycle, including imported and unlinked summaries',()=>{
 const d=data();d.observations[0].scan_summary_id='scan';assert.doesNotThrow(()=>validateData(d));d.observations[0].scan_summary_id='missing';assert.throws(()=>validateData(d),/same crop cycle/);d.observations[0].scan_summary_id='scan';d.scans[0].cycle_id=null;assert.throws(()=>validateData(d),/same crop cycle/);d.cycles.push({...d.cycles[0],id:'other'});d.scans[0].cycle_id='other';assert.throws(()=>validateData(d),/same crop cycle/);
});
test('real history excludes demo notes, demo parents and linked interface simulations',()=>{
 const d=data();assert.equal(isSyntheticObservation(d,d.observations[0]),false);
 for(const key of ['farms','fields','cycles','observations']){const copy=structuredClone(d);copy[key][0].origin='demo';assert.equal(observationHistory(copy,'cycle',false).length,0);assert.equal(observationHistory(copy,'cycle',true).length,1);}
 d.observations[0].scan_summary_id='scan';Object.assign(d.scans[0],{origin:'demo',availability:'simulation',demo_label:'Demo only'});assert.equal(observationHistory(d,'cycle',false).length,0);assert.equal(observationHistory(d,'cycle',true).length,1);
});
test('history sorts by local observation date then creation time without mutating notes or mixing cycles',()=>{
 const d=data();d.observations=[{...note('old'),date:'2026-10-05'},note('new'),{...note('latest'),created_at:'2026-10-07T01:00:00.000Z',updated_at:'2026-10-07T01:00:00.000Z'},{...note('other'),cycle_id:'other'}];const before=JSON.stringify(d);assert.deepEqual(observationHistory(d,'cycle',false).map(n=>n.id),['latest','new','old']);assert.equal(JSON.stringify(d),before);
});
test('screening deletion detaches notes atomically and preserves synthetic provenance and other records',()=>{
 const d=data();d.observations[0].scan_summary_id='scan';Object.assign(d.scans[0],{origin:'demo',availability:'simulation',demo_label:'Demo only'});d.observations.push(note('unlinked-note'));d.scans.push(scan('keep'));const before=JSON.stringify(d),now='2026-10-07T02:00:00.000Z',removed=removeScan(d,'scan',now);assert.deepEqual(removed.scans.map(s=>s.id),['keep']);assert.equal(removed.observations[0].note,d.observations[0].note);assert.equal(removed.observations[0].scan_summary_id,null);assert.equal(removed.observations[0].origin,'demo');assert.equal(removed.observations[0].updated_at,now);assert.deepEqual(removed.observations[1],d.observations[1]);assert.doesNotThrow(()=>validateData(removed));assert.equal(JSON.stringify(d),before);
});
test('v1-v6 backups migrate with empty observations; hidden arrays, missing arrays and future schemas reject',()=>{
 for(const [version,app] of [[1,'farm-m1-v1'],[2,'farm-m3-v2'],[3,'farm-m3-v3'],[4,'farm-m4-v4'],[5,'farm-m4-v5'],[6,'farm-m4-v6']]){
  const d=data();d.schema_version=version;delete d.observations;if(version<6)delete d.sales;if(version<5){delete d.expenses;delete d.harvests;}if(version<4)delete d.soil_tests;if(version<3)delete d.scans;if(version<2)delete d.tasks;
  const migrated=parseBackup(JSON.stringify({schema_version:version,application_version:app,exported_at:meta('x').created_at,includes_coordinates:false,data:d}));assert.equal(migrated.schema_version,7);assert.deepEqual(migrated.data.observations,[]);assert.deepEqual(migrated.data.cycles,d.cycles);assert.deepEqual(migrated.data.scans,d.scans ?? []);assert.throws(()=>validateData({...d,observations:[]}));
 }assert.throws(()=>validateData({...data(),observations:undefined}));assert.throws(()=>validateData({...data(),schema_version:8}));assert.throws(()=>validateData({...data(),observations:Array.from({length:1001},(_,i)=>note(String(i)))}));
});
test('observation backups/import conflicts preserve privacy; cycle/field cascades leave unrelated history',()=>{
 const d=data();d.fields[0].location={latitude:0,longitude:0,accuracy_m:null,method:'manual',confirmed_at:meta('x').created_at};const backup=makeBackup(d);assert.equal(backup.data.fields[0].location,null);assert.deepEqual(parseBackup(JSON.stringify(backup)).data.observations,d.observations);assert.equal(planImport(d,structuredClone(d)).additions,0);
 const changed=structuredClone(d);changed.observations[0].note='Changed test note';assert.equal(planImport(d,changed).conflicts.length,1);assert.equal(planImport(d,changed).merged.observations[0].note,d.observations[0].note);assert.equal(planImport(d,changed,'backup').merged.observations[0].note,changed.observations[0].note);
 d.fields.push({...d.fields[0],id:'other-field'});d.cycles.push({...d.cycles[0],id:'other',field_id:'other-field'});d.observations.push({...note('other-note'),cycle_id:'other'});assert.deepEqual(removeCycle(d,'cycle').observations.map(o=>o.id),['other-note']);assert.deepEqual(removeField(d,'field').observations.map(o=>o.id),['other-note']);assert.equal(d.observations.length,2);
});
test('v6 storage upgrades in memory then writes notes atomically, preserving diaries on stale/invalid writes',async()=>{
 globalThis.indexedDB=new IDBFactory();const d=data(),old={...d,schema_version:6,revision:2};delete old.observations;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(old,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const loaded=await loadFarm();assert.equal(loaded.schema_version,7);assert.deepEqual(loaded.observations,[]);assert.deepEqual(loaded.scans,d.scans);const saved=await saveFarm({...loaded,observations:d.observations},2);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...loaded,observations:[]},2),/another tab/);await assert.rejects(saveFarm({...saved,observations:[{...note(),scan_summary_id:'missing'}]},3));assert.deepEqual(await loadFarm(),saved);
});
test('season review counts real/demo observations separately without inferring money or crop health',()=>{
 const d=data();d.observations.push({...note('demo-note'),origin:'demo',date:'2026-10-06'});const real=seasonReview(d,'cycle'),demo=seasonReview(d,'cycle',true);assert.equal(real.observationCount,1);assert.equal(real.lastObservationDate,'2026-10-07');assert.equal(demo.observationCount,1);assert.equal(demo.lastObservationDate,'2026-10-06');assert.equal(real.balance,null);assert.equal(real.hasCosts,false);assert.equal(real.sold.count,0);assert.ok(real.gaps.some(g=>g.includes('not zero')));d.observations=[];assert.equal(seasonReview(d,'cycle').lastObservationDate,null);
});

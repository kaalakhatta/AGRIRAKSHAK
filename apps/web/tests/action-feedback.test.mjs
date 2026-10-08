import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { emptyData,validateData,makeBackup,parseBackup,planImport,removeCycle,removeField,todayInZone } from '../lib/domain/farm.ts';
import { recommendNextSteps } from '../lib/recommendations/next-steps.ts';
import { validateFeedback,recordFeedback,feedbackKey,matchingFeedback,feedbackActive } from '../lib/domain/action-feedback.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
const NOW='2026-10-07T20:00:00.000Z';
const meta=id=>({id,schema_version:1,created_at:NOW,updated_at:NOW,origin:'user'});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Test fixture',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Test field',region:null,area:null,water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Test crop',variety:null,status:'active',sowing_date:'2026-10-01',stage:null,stage_recorded_at:null,season:null}]});
const steps=(d,fieldId='field',cycleId='cycle',today='2026-10-08')=>recommendNextSteps({field:d.fields.find(f=>f.id===fieldId),cycle:d.cycles.find(c=>c.id===cycleId),tasks:d.tasks,soilTests:d.soil_tests,weather:null,hasLocation:false,today,now:Date.parse(NOW)});
const step=(d,id='coverage',fieldId='field',cycleId='cycle',today)=>steps(d,fieldId,cycleId,today).find(s=>s.id===id);
const respond=(d,s=step(d),state='done',snooze=null,note=null,fieldId='field',cycleId='cycle',now=NOW)=>recordFeedback(d,fieldId,cycleId,s,{state,snooze_until:snooze,note,input_key:feedbackKey(d,fieldId,cycleId,s)},now);
test('feedback validates bounded plain text, allowlisted statuses/steps, key scope and snooze shape',()=>{
 const d=respond(data()),f=d.feedback[0];assert.doesNotThrow(()=>validateFeedback(f));
 for(const patch of [{state:'expert_approved'},{generator_version:'agronomy-1'},{step_id:'prescribe'},{field_id:'other'},{input_key:'eval()'},{title:'Incorrect title'},{note:'x'.repeat(501)},{state:'snoozed',snooze_until:null},{state:'done',snooze_until:'2026-10-09'}])assert.throws(()=>validateFeedback({...f,...patch}));
 for(const patch of [{state:'snoozed',snooze_until:'2026-10-08'},{state:'snoozed',snooze_until:'2026-02-30'}])assert.throws(()=>respond(data(),step(data()),patch.state,patch.snooze_until));
 const future=respond(data(),step(data()),'snoozed','2026-10-09');assert.doesNotThrow(()=>validateData(future));future.feedback[0].snooze_until='2026-10-08';assert.throws(()=>validateData(future),/recording day/);
});
test('feedback updates the same input context without duplicate rows, snapshot revision or immutability drift',()=>{
 const d=data(),s=step(d),before=JSON.stringify(d),first=respond(d,s,'needs_help',null,'Synthetic QA question'),next=respond(first,s,'done',null,'Synthetic QA resolved','field','cycle','2026-10-07T20:01:00.000Z');assert.equal(next.feedback.length,1);assert.equal(first.feedback[0].id,next.feedback[0].id);assert.equal(next.feedback[0].created_at,NOW);assert.equal(next.feedback[0].state,'done');assert.equal(matchingFeedback(next,'field','cycle',s).note,'Synthetic QA resolved');assert.equal(feedbackKey(first,'field','cycle',s),feedbackKey(next,'field','cycle',s));assert.equal(JSON.stringify(d),before);
});
test('done/not-applicable hide only matching steps; needs-help stays active and snoozes expire on farm-local day',()=>{
 const d=data(),s=step(d);assert.equal(feedbackActive(null,'2026-10-08'),true);
 for(const state of ['pending','needs_help','done','not_applicable'])assert.equal(feedbackActive(respond(d,s,state).feedback[0],'2026-10-08'),['pending','needs_help'].includes(state));
 const snoozed=respond(d,s,'snoozed','2026-10-09').feedback[0];assert.equal(feedbackActive(snoozed,'2026-10-08'),false);assert.equal(feedbackActive(snoozed,'2026-10-09'),true);assert.equal(feedbackActive(snoozed,'2026-10-10'),true);assert.equal(todayInZone('America/Los_Angeles',new Date('2026-10-09T01:00:00Z')),'2026-10-08');
});
test('changed source revisions and card content require fresh feedback; previous responses stay historical',()=>{
 const d=respond(data()),s=step(d),oldKey=d.feedback[0].input_key;d.cycles[0].updated_at='2026-10-07T20:02:00.000Z';assert.equal(matchingFeedback(d,'field','cycle',s),null);assert.throws(()=>recordFeedback(d,'field','cycle',s,{state:'done',snooze_until:null,note:null,input_key:oldKey}),/inputs changed/);const next=respond(d,s);assert.equal(next.feedback.length,2);assert.notEqual(next.feedback[0].input_key,next.feedback[1].input_key);
 assert.equal(matchingFeedback(next,'field','cycle',{...s,why:'Updated inputs'}),null);const weather=step(d,'weather');const changed={...weather,why:'A newer weather estimate is available.'};assert.notEqual(feedbackKey(d,'field','cycle',weather),feedbackKey(d,'field','cycle',changed));
});
test('feedback isolates fields, cycles, no-cycle scopes and demo mode, including synthetic personal tasks',()=>{
 const d=respond(data());d.fields.push({...d.fields[0],id:'other-field'});d.cycles.push({...d.cycles[0],id:'other-cycle',field_id:'other-field'});assert.equal(matchingFeedback(d,'other-field','other-cycle',step(d)),null);assert.equal(matchingFeedback(d,'field',null,step(d)),null);
 for(const key of ['farms','fields','cycles']){const copy=structuredClone(d);copy[key][0].origin='demo';assert.equal(matchingFeedback(copy,'field','cycle',step(copy)),null);assert.equal(respond(copy).feedback.at(-1).origin,'demo');}
 d.tasks=[{...meta('task'),origin:'demo',cycle_id:'cycle',title:'Synthetic check',status:'pending',completed_at:null,schedule:{kind:'date',date:'2026-10-08'}}];assert.equal(respond(d,step(d,'task:task')).feedback.at(-1).origin,'demo');assert.throws(()=>feedbackKey(d,'other-field','cycle',step(d)),/selection/);
});
test('personal reminder feedback survives due-to-overdue timing, does not complete Plan tasks and resets on rescheduling',()=>{
 const d=data();d.tasks=[{...meta('task'),cycle_id:'cycle',title:'Synthetic check',status:'pending',completed_at:null,schedule:{kind:'date',date:'2026-10-08'}}];const due=step(d,'task:task','field','cycle','2026-10-08'),overdue=step(d,'task:task','field','cycle','2026-10-09');assert.equal(feedbackKey(d,'field','cycle',due),feedbackKey(d,'field','cycle',overdue));const saved=respond(d,due,'snoozed','2026-10-10');assert.equal(matchingFeedback(saved,'field','cycle',overdue).snooze_until,'2026-10-10');assert.equal(saved.tasks[0].status,'pending');assert.equal(feedbackActive(saved.feedback[0],'2026-10-09'),false);
 saved.tasks[0].schedule.date='2026-10-07';assert.equal(matchingFeedback(saved,'field','cycle',overdue),null);saved.tasks[0].status='done';assert.throws(()=>respond(saved,overdue),/no longer pending/);saved.tasks=[];assert.doesNotThrow(()=>validateData(saved));
});
test('feedback copies no structured coordinates/photos and rejects unsupported key payloads',()=>{
 const d=data();d.fields[0].location={latitude:0,longitude:0,accuracy_m:null,method:'manual',confirmed_at:NOW};const saved=respond(d,step(d),'needs_help',null,'<b>Synthetic plain-text note</b>'),f=saved.feedback[0];assert.ok(!JSON.stringify(f).includes('latitude'));assert.deepEqual(validateFeedback({...f,photo:'private',filename:'private',location:d.fields[0].location}),f);
 const parts=JSON.parse(f.input_key);parts[12]=['soil',NOW,{latitude:0}];assert.throws(()=>validateFeedback({...f,input_key:JSON.stringify(parts)}));const bad=JSON.parse(f.input_key);bad[11]=['task',NOW,JSON.stringify({kind:'date',date:'2026-10-08',private_photo:'private'})];assert.throws(()=>validateFeedback({...f,input_key:JSON.stringify(bad)}));
});
test('v1-v7 envelopes migrate without invented feedback; duplicate contexts, hidden arrays and future versions reject',()=>{
 for(const [version,app] of [[1,'farm-m1-v1'],[2,'farm-m3-v2'],[3,'farm-m3-v3'],[4,'farm-m4-v4'],[5,'farm-m4-v5'],[6,'farm-m4-v6'],[7,'farm-m4-v7']]){
  const d=data();d.schema_version=version;delete d.feedback;if(version<7)delete d.observations;if(version<6)delete d.sales;if(version<5){delete d.expenses;delete d.harvests;}if(version<4)delete d.soil_tests;if(version<3)delete d.scans;if(version<2)delete d.tasks;
  const b=parseBackup(JSON.stringify({schema_version:version,application_version:app,exported_at:NOW,includes_coordinates:false,data:d}));assert.equal(b.schema_version,8);assert.deepEqual(b.data.feedback,[]);assert.deepEqual(b.data.cycles,d.cycles);assert.throws(()=>validateData({...d,feedback:[]}));
 }
 const d=respond(data());assert.throws(()=>validateData({...d,feedback:[...d.feedback,{...d.feedback[0],id:'duplicate-context'}]}),/Duplicate feedback/);assert.throws(()=>validateData({...d,feedback:undefined}));assert.throws(()=>validateData({...d,schema_version:9}));
});
test('feedback backup/import conflicts and deletion cascades preserve separate no-cycle and unrelated records',()=>{
 const d=respond(data());assert.deepEqual(parseBackup(JSON.stringify(makeBackup(d))).data,d);assert.equal(planImport(d,structuredClone(d)).additions,0);const changed=structuredClone(d);changed.feedback[0].state='needs_help';assert.equal(planImport(d,changed).conflicts.length,1);assert.equal(planImport(d,changed).merged.feedback[0].state,'done');assert.equal(planImport(d,changed,'backup').merged.feedback[0].state,'needs_help');
 d.fields.push({...d.fields[0],id:'other-field'});d.cycles.push({...d.cycles[0],id:'other-cycle',field_id:'other-field'});const withOther=respond(d,step(d,'coverage','other-field','other-cycle'),'done',null,null,'other-field','other-cycle');const withField=respond(withOther,step(withOther,'water','field',null),'needs_help',null,null,'field',null);assert.equal(removeCycle(withField,'cycle').feedback.length,2);assert.equal(removeField(withField,'field').feedback.length,1);const bad=structuredClone(d);bad.fields=[];assert.throws(()=>validateData(bad));
});
test('v7 IndexedDB migration and revision-safe feedback persistence never fill missing inputs or bypass advice gates',async()=>{
 globalThis.indexedDB=new IDBFactory();const d=data(),old={...d,schema_version:7,revision:2};delete old.feedback;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(old,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const loaded=await loadFarm();assert.equal(loaded.schema_version,8);assert.deepEqual(loaded.feedback,[]);const s=step(loaded),saved=await saveFarm(respond(loaded,s),2);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...loaded,feedback:[]},2),/another tab/);await assert.rejects(saveFarm({...saved,feedback:[{...saved.feedback[0],field_id:'missing'}]},3));assert.deepEqual(await loadFarm(),saved);assert.equal(saved.fields[0].region,null);assert.equal(saved.cycles[0].season,null);assert.ok(steps(saved).some(s=>s.id==='coverage'));assert.equal(saved.scans.length,0);assert.equal(saved.soil_tests.length,0);
});

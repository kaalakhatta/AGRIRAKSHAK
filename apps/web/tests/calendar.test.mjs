import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { emptyData, validateData, makeBackup, parseBackup, planImport, removeCycle, removeField, todayInZone } from '../lib/domain/farm.ts';
import { addDays, dueDate, validateTask, taskTiming, reschedulePreview, rescheduleTasks } from '../lib/domain/calendar.ts';
import { loadFarm, saveFarm } from '../lib/storage/farm-store.ts';
const NOW='2026-10-06T12:00:00.000Z';
const meta=id=>({id,schema_version:1,created_at:NOW,updated_at:NOW,origin:'demo'});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Synthetic farm',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Synthetic field',region:null,area:null,water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Synthetic crop',variety:null,status:'planned',sowing_date:'2026-10-10',stage:null,stage_recorded_at:null,season:null}]});
const task=(id='reminder')=>({...meta(id),cycle_id:'cycle',title:'Synthetic reminder',schedule:{kind:'sowing',offset_days:2,anchor_date:'2026-10-10'},status:'pending',completed_at:null});
test('calendar arithmetic preserves local dates across leap years, DST and midnight boundaries',()=>{
 assert.equal(addDays('2024-02-28',1),'2024-02-29');assert.equal(addDays('2024-02-29',1),'2024-03-01');assert.equal(addDays('2026-03-08',1),'2026-03-09');assert.equal(addDays('2026-01-01',-1),'2025-12-31');assert.throws(()=>addDays('2026-02-29',2));assert.throws(()=>addDays('2026-01-01',0.5));assert.throws(()=>addDays('9999-12-31',1));
 const t=task();t.schedule={kind:'date',date:'2026-10-06'};const clock=new Date('2026-10-05T20:00:00Z');assert.equal(taskTiming(t,data().cycles[0],todayInZone('Asia/Kolkata',clock)),'Due today');assert.equal(taskTiming(t,data().cycles[0],todayInZone('America/Los_Angeles',clock)),'Upcoming');
});
test('unknown sowing and stages do not invent dates or infer stage from elapsed time',()=>{
 const t=task(),c=data().cycles[0];t.schedule.anchor_date=null;assert.equal(dueDate(t),null);assert.equal(taskTiming(t,c,'2026-10-20'),'Waiting for sowing date');t.schedule={kind:'stage',stage:'flowering'};assert.equal(dueDate(t),null);assert.match(taskTiming(t,c,'2099-01-01'),/Waiting/);c.stage='flowering';assert.equal(taskTiming(t,c,'2026-10-06'),'Ready at your confirmed stage');
});
test('rescheduling previews pending reminders, isolates cycles and preserves completed history',()=>{
 const pending=task(),done={...task('done'),status:'done',completed_at:NOW},other={...task('other'),cycle_id:'other-cycle'},c={...data().cycles[0],sowing_date:'2026-10-12'};const tasks=[pending,done,other],before=JSON.stringify(tasks);
 assert.deepEqual(reschedulePreview(tasks,c),[{id:'reminder',title:'Synthetic reminder',before:'2026-10-12',after:'2026-10-14'}]);assert.deepEqual(rescheduleTasks(tasks,c,'keep',NOW),tasks);const changed=rescheduleTasks(tasks,c,'shift',NOW);assert.equal(dueDate(changed[0]),'2026-10-14');assert.deepEqual(changed[1],done);assert.deepEqual(changed[2],other);assert.equal(JSON.stringify(tasks),before);c.sowing_date=null;assert.equal(reschedulePreview(tasks,c)[0].after,null);
});
test('reminder validation rejects invalid schedules, completion state, references and duplicate IDs',()=>{
 for(const change of [t=>t.schedule.offset_days=Infinity,t=>t.schedule.kind='eval',t=>t.status='done',t=>t.completed_at=NOW,t=>t.title=' ',t=>t.schedule={kind:'date',date:'2026-02-30'},t=>t.schedule={kind:'stage',stage:'guess'}]){const t=task();change(t);assert.throws(()=>validateTask(t));}
 const d=data();d.tasks=[task()];assert.doesNotThrow(()=>validateData(d));d.tasks[0].cycle_id='missing';assert.throws(()=>validateData(d));d.tasks=[task('field')];assert.throws(()=>validateData(d));
});
test('v1 backup migration preserves farm data and privacy, v2 retains reminders and rejects version mismatch',()=>{
 const legacy=data();legacy.schema_version=1;delete legacy.tasks;delete legacy.scans;delete legacy.soil_tests;const old={schema_version:1,application_version:'farm-m1-v1',exported_at:NOW,includes_coordinates:false,data:legacy};const parsed=parseBackup(JSON.stringify(old));assert.equal(parsed.schema_version,4);assert.deepEqual(parsed.data.tasks,[]);assert.deepEqual(parsed.data.cycles,legacy.cycles);assert.equal(legacy.schema_version,1);
 const d=data();d.tasks=[task()];const b=makeBackup(d);assert.deepEqual(parseBackup(JSON.stringify(b)).data.tasks,d.tasks);assert.throws(()=>parseBackup(JSON.stringify({...b,data:legacy})));assert.throws(()=>validateData({...legacy,tasks:[task()]}));assert.throws(()=>validateData({...d,schema_version:5}));
});
test('calendar import is idempotent, conflicts require choice and deletions cascade',()=>{
 const d=data();d.tasks=[task()];assert.equal(planImport(d,structuredClone(d)).additions,0);const incoming=structuredClone(d);incoming.tasks[0].title='Changed synthetic reminder';assert.equal(planImport(d,incoming).conflicts.length,1);assert.equal(planImport(d,incoming,'device').merged.tasks[0].title,d.tasks[0].title);assert.equal(planImport(d,incoming,'backup').merged.tasks[0].title,incoming.tasks[0].title);assert.equal(removeCycle(d,'cycle').tasks.length,0);assert.equal(removeField(d,'field').tasks.length,0);assert.equal(d.tasks.length,1);
});
test('legacy stored snapshot is upgraded in memory and next write is revision-safe, atomic and persistent',async()=>{
 globalThis.indexedDB=new IDBFactory();const legacy=data();legacy.schema_version=1;delete legacy.tasks;delete legacy.scans;delete legacy.soil_tests;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({...legacy,revision:4},'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const loaded=await loadFarm();assert.equal(loaded.schema_version,4);assert.equal(loaded.revision,4);loaded.tasks=[task()];const saved=await saveFarm(loaded,4);assert.equal(saved.revision,5);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...saved,tasks:[]},4),/another tab/);assert.deepEqual(await loadFarm(),saved);
});

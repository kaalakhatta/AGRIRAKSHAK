import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, makeBackup, validateData } from '../lib/domain/farm.ts';
import { addExhibitionData, exhibitionData } from '../lib/domain/exhibition.ts';
import { farmGuidance } from '../lib/recommendations/farm-guidance.ts';
const now='2026-10-08T18:00:00.000Z';
test('exhibition sample is valid, wholly synthetic, coordinate-free and cannot become farm advice',()=>{
  const data=exhibitionData(now);assert.deepEqual(validateData(data),data);
  for(const [key,rows] of Object.entries(data))if(key!=='schema_version')for(const record of rows)assert.equal(record.origin,'demo');
  assert.deepEqual(data.cycles.map(c=>c.crop),['Soybean','Wheat','Gram/chickpea']);assert.equal(data.fields[0].location,null);assert.deepEqual(data.soil_tests,[]);assert.deepEqual(data.scans,[]);
  for(const cycle of data.cycles)assert.equal(farmGuidance({...data,revision:0},data.fields[0].id,cycle.id,Date.parse(now)).status,'demo');
  assert.equal(makeBackup(data).includes_coordinates,false);
});
test('sample addition preserves existing records, is idempotent and rejects ID collisions without mutation',()=>{
  const current=emptyData();current.farms=[{id:'existing',schema_version:1,created_at:now,updated_at:now,origin:'user',name:'Existing real record',language:'en',timezone:'Asia/Kolkata'}];
  const before=structuredClone(current),added=addExhibitionData(current,now);assert.deepEqual(current,before);assert.deepEqual(added.farms[0],current.farms[0]);assert.equal(added.farms.length,2);assert.equal(addExhibitionData(added,now),added);
  const collision=structuredClone(current);collision.fields=[{id:'exhibition-v1-field',schema_version:1,created_at:now,updated_at:now,origin:'user',farm_id:'existing',name:'Existing field',region:null,area:null,water:'unknown',location:null}];const original=structuredClone(collision);assert.throws(()=>addExhibitionData(collision,now),/conflict/);assert.deepEqual(collision,original);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOVERNMENT_SCHEMES, INCOME_CONDITIONS } from '../lib/content/scheme-catalog.ts';
import { fieldState, matchGovernmentSchemes, schemeCrop } from '../lib/domain/scheme-matching.ts';
import { createFieldSetup } from '../lib/domain/field-setup.ts';
import { emptyData } from '../lib/domain/farm.ts';

const clock = new Date('2026-10-09T06:00:00Z');
const field = { id: 'field-a', farm_id: 'farm', name: 'Synthetic Sehore field', region: 'Sehore, Madhya Pradesh', water: 'rainfed', area: { value: 4, unit: 'ha' } };
const cycle = { id: 'cycle-a', field_id: field.id, crop: 'Soybean', season: 'Kharif' };
const income = { family_land: 'yes', land_date: 'before', institutional: 'no', public_office: 'no', government_employee: 'no', pension: 'no', income_tax: 'no', professional: 'no' };
const run = (answers = {}, selectedField = field, selectedCycle = cycle, now = clock) => matchGovernmentSchemes(selectedField, selectedCycle, answers, now);
const decision = (id, answers = {}, selectedField = field, selectedCycle = cycle, now = clock) => run(answers, selectedField, selectedCycle, now).find(d => d.scheme.id === id);

test('field data alone does not establish income support; household ownership is distinct from field tenancy and area', () => {
  assert.equal(decision('pm-kisan').status, 'needs_info');
  assert.equal(decision('pm-kisan', income).status, 'potential');
  assert.equal(decision('mp-kisan-kalyan', { ...income, tenure: 'tenant' }).status, 'potential');
  assert.equal(decision('pm-kisan', { ...income, family_land: 'no' }).status, 'not_matching');
  assert.equal(decision('pm-kisan', { ...income, land_date: 'inheritance' }).status, 'potential');
  assert.equal(decision('pm-kisan', { ...income, land_date: 'other' }).status, 'not_matching');
  assert.ok(decision('pm-kisan', income).cautions.some(text => /verify/.test(text)));
});
test('all published household exclusion categories block both income schemes; unknown is never No', () => {
  for (const key of ['institutional', 'public_office', 'government_employee', 'pension', 'income_tax', 'professional']) {
    for (const id of ['pm-kisan', 'mp-kisan-kalyan']) {
      assert.equal(decision(id, { ...income, [key]: 'yes' }).status, 'not_matching');
      assert.equal(decision(id, { ...income, [key]: 'unknown' }).status, 'needs_info');
      assert.equal(decision(id, { ...income, [key]: undefined }).status, 'needs_info');
    }
  }
  assert.match(INCOME_CONDITIONS.find(rule => rule.key === 'government_employee').question, /MTS.*Class IV.*Group D/);
  assert.match(INCOME_CONDITIONS.find(rule => rule.key === 'pension').question, /10,000.*MTS/);
  assert.equal(decision('pm-kisan', { income_tax: 'yes' }).status, 'not_matching'); // known blocker wins over missing inputs
});
test('tenants and sharecroppers retain credit routes; insurance requires crop/region/season notification', () => {
  for (const tenure of ['owner', 'tenant', 'sharecropper']) assert.equal(decision('kcc', { tenure }).status, 'potential');
  assert.equal(decision('pmfby', { tenure: 'tenant' }).status, 'verify');
  assert.equal(decision('pmfby', {}, field, { ...cycle, season: null }).status, 'needs_info');
  assert.equal(decision('pmfby', {}, { ...field, region: 'MP' }).status, 'needs_info');
  assert.equal(decision('pmfby', {}, field, { ...cycle, field_id: 'other-field' }).status, 'needs_info');
  assert.ok(decision('pmfby').cautions.some(text => /notification/.test(text)));
});
test('micro-irrigation uses explicit water-source and seven-year benefit questions, not a rainfed guess', () => {
  const answers = { tenure: 'owner', water_source: 'yes', irrigation_benefit: 'no' };
  assert.equal(decision('mp-micro-irrigation', answers).status, 'potential');
  for (const edit of [{ tenure: 'tenant' }, { water_source: 'no' }, { irrigation_benefit: 'yes' }]) assert.equal(decision('mp-micro-irrigation', { ...answers, ...edit }).status, 'not_matching');
  assert.equal(decision('mp-micro-irrigation', { tenure: 'owner' }).status, 'needs_info');
  assert.equal(decision('mp-balram-tal', { tenure: 'owner', drip_commitment: 'yes' }).status, 'verify');
});
test('crop groups and selected cycles alter relevant support; unknown cycles cannot inherit another field’s crop', () => {
  assert.equal(decision('mp-oilseed-mission', { tenure: 'owner' }).status, 'verify');
  assert.equal(decision('mp-food-security', { tenure: 'owner' }).status, 'not_matching');
  for (const crop of ['Wheat', 'Gram/chickpea', 'Gram / chickpea', 'gram']) assert.equal(decision('mp-food-security', { tenure: 'owner' }, field, { ...cycle, crop }).status, 'verify');
  assert.equal(decision('mp-oilseed-mission', { tenure: 'owner' }, field, null).status, 'needs_info');
  assert.equal(schemeCrop('Paddy'), 'rice');
  assert.equal(decision('mp-oilseed-mission', { tenure: 'owner' }, field, { ...cycle, field_id: 'other' }).status, 'needs_info');
});
test('state is confirmed manually when missing; unsupported service regions do not produce eligibility claims', () => {
  for (const region of ['Madhya Pradesh', 'Sehore, MP', 'सीहोर, मध्यप्रदेश']) assert.equal(fieldState(region), 'mp');
  for (const region of [null, 'Sehore', 'MPwhatever', 'Rajasthan']) assert.equal(fieldState(region), 'unknown');
  const unknown = { ...field, region: null };
  assert.equal(decision('kcc', { tenure: 'owner' }, unknown).status, 'needs_info');
  assert.equal(decision('kcc', { tenure: 'owner', state: 'mp' }, unknown).status, 'potential');
  assert.ok(run({ state: 'other' }, unknown).every(item => item.status === 'not_matching'));
  assert.equal(decision('kcc', { tenure: 'owner', state: 'forged' }, unknown).status, 'needs_info');
});
test('unrecognised answers and stale/invalid clocks cannot manufacture potential matches', () => {
  assert.equal(decision('kcc', { tenure: 'yes' }).status, 'needs_info');
  assert.equal(decision('pm-kisan', { ...income, income_tax: 'false' }).status, 'needs_info');
  for (const now of [new Date('2027-01-10T00:00:00Z'), new Date('2025-01-01T00:00:00Z'), new Date('invalid')]) assert.equal(decision('pm-kisan', income, field, cycle, now).status, 'verify');
});
test('catalogue is sourced, government-only, immutable during screening and explicit about unverified windows', () => {
  const before = structuredClone({ field, cycle, income, catalog: GOVERNMENT_SCHEMES });
  run(income);
  assert.deepEqual({ field, cycle, income, catalog: GOVERNMENT_SCHEMES }, before);
  assert.equal(new Set(GOVERNMENT_SCHEMES.map(entry => entry.id)).size, GOVERNMENT_SCHEMES.length);
  assert.equal(GOVERNMENT_SCHEMES.length, 16);
  assert.ok(!GOVERNMENT_SCHEMES.some(entry => ['agricultural-term-loan', 'warehouse-receipt'].includes(entry.id)));
  for (const entry of GOVERNMENT_SCHEMES) {
    for (const link of [entry.source, entry.portal]) { const url = new URL(link.url); assert.equal(url.protocol, 'https:'); assert.ok(url.hostname.endsWith('.gov.in')); }
    assert.ok(entry.office_checks.length); assert.ok(entry.availability); assert.equal(entry.checked_on, '2026-10-09');
  }
  assert.equal(decision('pm-kusum', { solar: 'yes' }).status, 'verify');
});
test('setup retains optional field area through the existing validated record contract', () => {
  const input = { name: 'Synthetic field', district: 'Sehore', coordinates: null, remember: false, crop: 'soybean', season: 'Kharif', water: 'rainfed', area: { value: 2, unit: 'acre' } };
  const result = createFieldSetup(emptyData(), input, clock.toISOString());
  assert.deepEqual(result.field.area, input.area); assert.equal(result.field.location, null);
  assert.throws(() => createFieldSetup(emptyData(), { ...input, area: { value: 0, unit: 'ha' } }, clock.toISOString()));
  assert.throws(() => createFieldSetup(emptyData(), { ...input, area: { value: Infinity, unit: 'ha' } }, clock.toISOString()));
});

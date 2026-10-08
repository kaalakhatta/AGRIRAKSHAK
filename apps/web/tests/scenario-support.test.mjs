import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateScenario } from '../lib/domain/scenario.ts';
import { FARMER_SUPPORT, findSupport } from '../lib/content/farmer-support.ts';

const scenario = () => ({ area: '1', area_unit: 'ha', yield_kg_ha: '1000', price_rupees_kg: '20', costs: ['1000', '500', '2000', '500', '250', '250'] });
test('scenario uses entered assumptions and total-field costs with exact paise and no mutation', () => {
  const input = scenario(), before = structuredClone(input), result = estimateScenario(input);
  assert.equal(result.harvest_kg, 1000); assert.equal(result.revenue_minor, 2000000n); assert.equal(result.total_cost_minor, 450000n); assert.equal(result.margin_minor, 1550000n); assert.deepEqual(input, before);
  const fraction = { ...scenario(), area: '0.01', yield_kg_ha: '1', price_rupees_kg: '0.50', costs: ['0', '0', '0', '0', '0', '0'] };
  assert.equal(estimateScenario(fraction).revenue_minor, 1n); // exactly half a paise, rounded once
  fraction.price_rupees_kg = '0.49'; assert.equal(estimateScenario(fraction).revenue_minor, 0n);
});
test('area units normalize explicitly, zero is explicit and a loss remains negative', () => {
  const input = scenario(); input.area = '10000'; input.area_unit = 'm2'; assert.equal(estimateScenario(input).harvest_kg, 1000);
  input.area = '1'; input.area_unit = 'acre'; assert.equal(estimateScenario(input).harvest_kg, 404.68564224); assert.equal(estimateScenario(input).revenue_minor, 809371n);
  input.yield_kg_ha = '0'; assert.equal(estimateScenario(input).margin_minor, -450000n);
  input.yield_kg_ha = '1000'; input.price_rupees_kg = '0'; assert.equal(estimateScenario(input).revenue_minor, 0n);
});
test('unknowns, malformed inputs, unsupported units and overflow cannot create scenario results', () => {
  for (const edit of [i => i.area = '', i => i.area = '0', i => i.area = '-1', i => i.area = '1e3', i => i.area_unit = '__proto__', i => i.yield_kg_ha = 'NaN', i => i.yield_kg_ha = '1.0001', i => i.price_rupees_kg = '0.001', i => i.price_rupees_kg = '1,000', i => i.costs[0] = '', i => i.costs[0] = 'Infinity', i => i.costs[0] = '-1', i => i.costs.pop(), i => { i.area = '9007199254740991'; i.yield_kg_ha = '2'; }]) { const input = scenario(); edit(input); assert.throws(() => estimateScenario(input)); }
  const input = scenario(); input.costs.fill('90071992547409.91'); assert.throws(() => estimateScenario(input), /totals/);
});
test('support category and multiword search combine without mutating the public directory', () => {
  const before = structuredClone(FARMER_SUPPORT);
  assert.equal(findSupport('all', '').length, 9); assert.deepEqual(findSupport('insurance', '').map(entry => entry.id), ['pmfby', 'rwbcis']);
  assert.deepEqual(findSupport('loans', ' solar  pump ').map(entry => entry.id), ['pm-kusum']); assert.deepEqual(findSupport('schemes', 'PM-KISAN').map(entry => entry.id), ['pm-kisan']); assert.deepEqual(findSupport('insurance', 'soil'), []);
  assert.deepEqual(FARMER_SUPPORT, before);
});
test('scheme snapshots retain sources and crucial eligibility, rate and availability qualifications', () => {
  const ids = new Set();
  for (const entry of FARMER_SUPPORT) { assert.ok(!ids.has(entry.id)); ids.add(entry.id); assert.equal(entry.checked_on, '2026-10-09'); assert.ok(entry.availability); for (const link of [entry.source, entry.portal]) { const url = new URL(link.url); assert.equal(url.protocol, 'https:'); assert.equal(url.username, ''); assert.equal(url.password, ''); assert.ok(['gov.in', 'bank.in'].some(domain => url.hostname.endsWith(`.${domain}`))); } }
  const byId = id => FARMER_SUPPORT.find(entry => entry.id === id);
  assert.match(byId('pm-kisan').audience, /old two-hectare cap is not/); assert.match(byId('kcc').caution, /Do not assume/); assert.match(byId('pm-kusum').availability, /unverified/); assert.match(byId('pmfby').caution, /does not confirm Sehore/);
});

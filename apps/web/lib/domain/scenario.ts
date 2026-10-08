// Exact decimal arithmetic for user-entered assumptions; no crop yield or price defaults.
export const SCENARIO_COSTS = ['Seeds', 'Water / irrigation', 'Labour', 'Equipment', 'Transport', 'Other costs'] as const;
export type ScenarioInput = { area: string; area_unit: 'ha' | 'acre' | 'm2'; yield_kg_ha: string; price_rupees_kg: string; costs: string[] };
type Fraction = { n: bigint; d: bigint };
function decimal(value: string, label: string, places: number, zero = false): Fraction {
  if (typeof value !== 'string') throw new Error(`${label}: enter a number.`);
  const text = value.trim();
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(text) || text.length > 24) throw new Error(`${label}: enter a non-negative decimal with at most ${places} decimal places.`);
  const [whole, fraction = ''] = text.split('.'), n = BigInt(whole + fraction), d = BigInt(10) ** BigInt(fraction.length);
  if ((!zero && n === BigInt(0)) || n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label}: value is outside the supported range.`);
  return { n, d };
}
const HECTARES: Record<ScenarioInput['area_unit'], Fraction> = { ha: { n: BigInt(1), d: BigInt(1) }, acre: { n: BigInt(40468564224), d: BigInt(100000000000) }, m2: { n: BigInt(1), d: BigInt(10000) } };
export function estimateScenario(input: ScenarioInput) {
  if (!input || !Object.hasOwn(HECTARES, input.area_unit) || !Array.isArray(input.costs) || input.costs.length !== SCENARIO_COSTS.length) throw new Error('Choose a supported area unit and enter all six cost categories. Enter 0 only for a known zero cost.');
  const area = decimal(input.area, 'Area', 8), conversion = HECTARES[input.area_unit], yieldValue = decimal(input.yield_kg_ha, 'Expected yield', 3, true), price = decimal(input.price_rupees_kg, 'Expected selling price', 2, true);
  const massN = area.n * conversion.n * yieldValue.n, massD = area.d * conversion.d * yieldValue.d;
  const revenueN = massN * price.n * BigInt(100), revenueD = massD * price.d;
  // Expected revenue is rounded once to the nearest paise, halves upwards.
  const revenue_minor = (revenueN * BigInt(2) + revenueD) / (BigInt(2) * revenueD);
  const costs_minor = input.costs.map((value, index) => { const amount = decimal(value, SCENARIO_COSTS[index], 2, true); return amount.n * (BigInt(100) / amount.d); });
  const total_cost_minor = costs_minor.reduce((sum, value) => sum + value, BigInt(0));
  if (revenue_minor > BigInt(Number.MAX_SAFE_INTEGER) || total_cost_minor > BigInt(Number.MAX_SAFE_INTEGER) || massN > BigInt(Number.MAX_SAFE_INTEGER) * massD) throw new Error('Scenario totals are outside the supported range.');
  const harvest_kg = Number(massN) / Number(massD);
  return { harvest_kg, revenue_minor, total_cost_minor, margin_minor: revenue_minor - total_cost_minor, costs_minor };
}

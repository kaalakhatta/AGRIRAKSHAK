import { validateDate, type Meta, type Field, type FarmData } from './farm.ts';

export const EXPENSE_CATEGORIES = ['Seeds', 'Water', 'Labour', 'Equipment', 'Transport', 'Other inputs', 'Other'] as const;
export const HARVEST_UNITS = ['kg', 'g', 't', 'piece'] as const;
export type Expense = Meta & { cycle_id: string; date: string; category: typeof EXPENSE_CATEGORIES[number]; kind: 'cost' | 'refund'; amount_minor: number; currency: 'INR'; note: string | null };
export type Harvest = Meta & { cycle_id: string; date: string; quantity: number; unit: typeof HARVEST_UNITS[number]; harvested_area: Field['area']; note: string | null };
export type Sale = Meta & { cycle_id: string; date: string; quantity: number; unit: typeof HARVEST_UNITS[number]; gross_amount_minor: number; currency: 'INR'; note: string | null };
function fail(message: string): never { throw new Error(`${message} No records were changed.`); }
function record(value: unknown): Record<string,unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected a season record.');
  return value as Record<string,unknown>;
}
function text(value: unknown, max = 120): string { if (typeof value !== 'string' || !value.trim() || value.length > max) fail('Invalid record text.'); return value; }
function time(value: unknown): string {
  const s = text(value,30);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0,19) !== s.slice(0,19)) fail('Invalid record time.');
  return s;
}
function base(v: Record<string,unknown>) {
  const created_at=time(v.created_at), updated_at=time(v.updated_at);
  if (v.schema_version !== 1 || !['user','demo','import'].includes(v.origin as string) || Date.parse(updated_at) < Date.parse(created_at)) fail('Invalid season record metadata.');
  const date=validateDate(v.date); if (!date) fail('Record date is required.');
  return {id:text(v.id),schema_version:1 as const,created_at,updated_at,origin:v.origin as Meta['origin'],cycle_id:text(v.cycle_id),date,note:v.note === null ? null : text(v.note,500)};
}
export function parseRupees(value: string): number {
  const input=value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(input) || input.length > 20) fail('Enter a positive INR amount with at most two decimal places.');
  const [whole,fraction='']=input.split('.');
  const paise=BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,'0'));
  if (paise <= BigInt(0) || paise > BigInt(Number.MAX_SAFE_INTEGER)) fail('INR amount is outside the supported range.');
  return Number(paise);
}
export function rupeeInput(minor: number): string {return `${BigInt(minor)/BigInt(100)}.${String(BigInt(minor)%BigInt(100)).padStart(2,'0')}`;}
export function formatINR(minor: bigint): string { const amount=minor < BigInt(0) ? -minor : minor; return `${minor < BigInt(0) ? '−' : ''}₹${(amount/BigInt(100)).toLocaleString('en-IN')}.${String(amount%BigInt(100)).padStart(2,'0')}`; }
export function validateExpense(value: unknown): Expense {
  const v=record(value), b=base(v);
  if (!EXPENSE_CATEGORIES.includes(v.category as Expense['category']) || !['cost','refund'].includes(v.kind as string) || v.currency !== 'INR' || typeof v.amount_minor !== 'number' || !Number.isSafeInteger(v.amount_minor) || v.amount_minor <= 0) fail('Invalid expense category, kind or INR amount.');
  return {...b,category:v.category as Expense['category'],kind:v.kind as Expense['kind'],amount_minor:v.amount_minor,currency:'INR'};
}
export const AREA_M2 = {ha:10000,acre:4046.8564224,m2:1} as const;
const KG = {kg:1,g:0.001,t:1000} as const;
export function massKg(h: Pick<Harvest,'quantity'|'unit'>): number | null {
  if (h.unit === 'piece') return null;
  const mass=h.quantity*KG[h.unit]; return Number.isFinite(mass) && mass > 0 ? mass : null;
}
export function areaHa(area: Field['area']): number | null {
  if (!area) return null;
  const hectares=area.value*(AREA_M2[area.unit]/10000);return Number.isFinite(hectares) && hectares > 0 ? hectares : null;
}
function quantity(v: Record<string,unknown>) {
  if (!HARVEST_UNITS.includes(v.unit as Harvest['unit']) || typeof v.quantity !== 'number' || !Number.isFinite(v.quantity) || v.quantity <= 0 || (v.unit === 'piece' && !Number.isSafeInteger(v.quantity))) fail('Enter a positive quantity with a supported unit; pieces must be whole numbers.');
  const result={quantity:v.quantity,unit:v.unit as Harvest['unit']};
  if (result.unit !== 'piece' && !massKg(result)) fail('Weight cannot be normalized.');
  return result;
}
export function validateSale(value: unknown): Sale {
  const v=record(value);
  if (v.currency !== 'INR' || typeof v.gross_amount_minor !== 'number' || !Number.isSafeInteger(v.gross_amount_minor) || v.gross_amount_minor <= 0) fail('Enter a positive received amount in whole INR paise.');
  return {...base(v),...quantity(v),gross_amount_minor:v.gross_amount_minor,currency:'INR'};
}
export function validateHarvest(value: unknown): Harvest {
  const v=record(value), b=base(v), q=quantity(v);
  let harvested_area: Field['area']=null;
  if (v.harvested_area !== null) {
    const a=record(v.harvested_area);
    if (typeof a.unit !== 'string' || !Object.hasOwn(AREA_M2,a.unit) || typeof a.value !== 'number' || !Number.isFinite(a.value) || a.value <= 0) fail('Invalid harvested area.');
    harvested_area={value:a.value,unit:a.unit as NonNullable<Field['area']>['unit']};
    if (!areaHa(harvested_area)) fail('Harvested area cannot be normalized.');
  }
  return {...b,...q,harvested_area};
}
export function expenseTotals(records: Expense[], cycleId: string) {
  const selected=records.filter(e=>e.cycle_id === cycleId);
  const costs=selected.filter(e=>e.kind === 'cost').reduce((sum,e)=>sum+BigInt(e.amount_minor),BigInt(0));
  const refunds=selected.filter(e=>e.kind === 'refund').reduce((sum,e)=>sum+BigInt(e.amount_minor),BigInt(0));
  const categories=EXPENSE_CATEGORIES.map(category=>({category,net:selected.filter(e=>e.category === category).reduce((sum,e)=>sum+(e.kind === 'refund' ? -BigInt(1) : BigInt(1))*BigInt(e.amount_minor),BigInt(0))}));
  return {count:selected.length,costs,refunds,net:costs-refunds,categories};
}
export function harvestTotals(records: Pick<Harvest,'cycle_id'|'quantity'|'unit'>[], cycleId: string) {
  const selected=records.filter(h=>h.cycle_id === cycleId), weights=selected.filter(h=>h.unit !== 'piece');
  const total=weights.reduce((sum,h)=>sum+massKg(h)!,0);
  return {count:selected.length,mass_kg:weights.length && Number.isFinite(total) ? total : null,pieces:selected.filter(h=>h.unit === 'piece').reduce((sum,h)=>sum+BigInt(h.quantity),BigInt(0)),has_pieces:selected.some(h=>h.unit === 'piece')};
}
export function saleTotals(records: Sale[], cycleId: string) {
  const selected=records.filter(s=>s.cycle_id === cycleId);
  return {...harvestTotals(selected,cycleId),received:selected.reduce((sum,s)=>sum+BigInt(s.gross_amount_minor),BigInt(0))};
}
// This is a diary comparison, never an inventory or profit calculation.
export function seasonReview(data: FarmData, cycleId: string, demo = false) {
  const cycle=data.cycles.find(c=>c.id === cycleId);
  if (!cycle) fail('Choose an existing crop cycle.');
  const field=data.fields.find(f=>f.id === cycle.field_id)!;
  const parentDemo=cycle.origin === 'demo' || field.origin === 'demo' || data.farms.find(f=>f.id === field.farm_id)?.origin === 'demo';
  const select=<T extends Meta & {cycle_id:string}>(rows:T[])=>rows.filter(r=>r.cycle_id === cycleId && (parentDemo || r.origin === 'demo') === demo);
  const expenses=select(data.expenses), harvests=select(data.harvests), sales=select(data.sales);
  const outlay=expenseTotals(expenses,cycleId), harvest=harvestTotals(harvests,cycleId), sold=saleTotals(sales,cycleId);
  const hasCosts=expenses.some(e=>e.kind === 'cost');
  let weightDifference:number|null=null;
  if (harvest.mass_kg !== null && sold.mass_kg !== null) {
    const difference=harvest.mass_kg-sold.mass_kg;
    // Suppress binary floating-point noise, without rounding entered quantities.
    weightDifference=Math.abs(difference) <= Number.EPSILON*8*Math.max(harvest.mass_kg,sold.mass_kg) ? 0 : difference;
  }
  const pieceDifference=harvest.has_pieces && sold.has_pieces ? harvest.pieces-sold.pieces : null;
  const gaps:string[]=[];
  if (!hasCosts) gaps.push('No cost entries: net outlay and a receipts-minus-outlay comparison are unavailable. Refunds alone do not establish costs.');
  if (!sales.length) gaps.push('No sales recorded: receipts are unknown, not zero.');
  if (!harvests.length) gaps.push('No harvests recorded: harvested quantity is unknown.');
  if (harvests.some(h=>h.harvested_area === null)) gaps.push('Some harvest areas are missing. Per-picking weight per area is available only where both inputs were recorded.');
  if ((harvest.count && harvest.mass_kg === null && harvests.some(h=>h.unit !== 'piece')) || (sold.count && sold.mass_kg === null && sales.some(s=>s.unit !== 'piece'))) gaps.push('A weight total exceeds the supported numeric range; that comparison is unavailable.');
  if ((weightDifference !== null && weightDifference < 0) || (pieceDifference !== null && pieceDifference < BigInt(0))) gaps.push('Recorded sales exceed recorded harvests for a matching unit type. Check for missing pickings, duplicate sales or entry mistakes.');
  return {outlay,harvest,sold,hasCosts,balance:hasCosts && sales.length ? sold.received-outlay.net : null,weightDifference,pieceDifference,gaps,entryCount:expenses.length+harvests.length+sales.length};
}
export function harvestYield(h: Harvest): number | null {
  const mass=massKg(h), area=areaHa(h.harvested_area);
  if (mass === null || area === null) return null;
  const result=mass/area;return Number.isFinite(result) && result > 0 ? result : null;
}
export function formatQuantity(value: number): string {
  return value !== 0 && Math.abs(value) < 0.000001 ? value.toExponential(4) : value.toLocaleString('en-IN',{maximumFractionDigits:6});
}

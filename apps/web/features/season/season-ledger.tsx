"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { newMeta, todayInZone, type Snapshot } from '@/lib/domain/farm';
import { EXPENSE_CATEGORIES, HARVEST_UNITS, expenseTotals, harvestTotals, harvestYield, parseRupees, rupeeInput, formatINR, formatQuantity, validateExpense, validateHarvest, validateSale, saleTotals, type Expense, type Harvest, type Sale } from '@/lib/domain/season-records';
import { loadFarm, saveFarm } from '@/lib/storage/farm-store';

type Mode = 'expenses' | 'harvests' | 'sales';
const blank = () => ({date:'',note:'',demo:false,amount:'',category:'Seeds' as Expense['category'],kind:'cost' as Expense['kind'],quantity:'',unit:'kg' as Harvest['unit'],area:'',areaUnit:'ha' as 'ha'|'acre'|'m2'});
export function SeasonLedger({mode}: {mode: Mode}) {
  const [snapshot,setSnapshot]=useState<Snapshot | null>(null),[cycleId,setCycleId]=useState('');
  const [draft,setDraft]=useState(blank),[editing,setEditing]=useState<string | null>(null),[deletion,setDeletion]=useState<string | null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const operation=useRef(false),formRef=useRef<HTMLElement>(null),deleteRef=useRef<HTMLElement>(null);
  useEffect(()=>{let active=true;loadFarm().then(s=>{if(active)setSnapshot(s);}).catch(e=>{if(active)setError(e instanceof Error ? e.message : 'Storage unavailable.');});return()=>{active=false;};},[]);
  useEffect(()=>{if(deletion)deleteRef.current?.focus();},[deletion]);
  const cycle=snapshot?.cycles.find(c=>c.id === cycleId),field=snapshot?.fields.find(f=>f.id === cycle?.field_id);
  const zone=snapshot?.farms.find(f=>f.id === field?.farm_id)?.timezone ?? 'UTC';
  const records=(snapshot?.[mode].filter(r=>r.cycle_id === cycleId) ?? []).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const existing=snapshot?.[mode].find(r=>r.id === editing);
  const parentDemo=cycle?.origin === 'demo' || field?.origin === 'demo' || snapshot?.farms.find(f=>f.id === field?.farm_id)?.origin === 'demo';
  const forceDemo=parentDemo || existing?.origin === 'demo';
  const name=mode === 'expenses' ? 'expense' : mode === 'sales' ? 'sale' : 'harvest';
  const title=mode === 'expenses' ? 'Expense' : mode === 'sales' ? 'Sale' : 'Harvest';
  function reset() {setDraft(blank());setEditing(null);setDeletion(null);}
  async function persist(data: Snapshot,success: string) {
    if(!snapshot || operation.current)return false;
    operation.current=true;setBusy(true);setError('');setMessage('');
    try {setSnapshot(await saveFarm(data,snapshot.revision));setMessage(success);return true;}
    catch(e){setError(e instanceof Error ? e.message : 'Could not save records.');return false;}
    finally{operation.current=false;setBusy(false);}
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!snapshot || !cycle || operation.current)return;
    try {
      const now=new Date().toISOString(),base={...(existing ?? newMeta(now)),updated_at:now,origin:forceDemo || draft.demo ? 'demo' as const : existing?.origin === 'import' ? 'import' as const : 'user' as const,cycle_id:cycle.id,date:draft.date,note:draft.note.trim() || null};
      let data: Snapshot;
      if(mode === 'expenses') {
        const record=validateExpense({...base,category:draft.category,kind:draft.kind,amount_minor:parseRupees(draft.amount),currency:'INR'});
        data={...snapshot,expenses:[...snapshot.expenses.filter(r=>r.id !== record.id),record]};
      } else if(mode === 'sales') {
        const record=validateSale({...base,quantity:Number(draft.quantity),unit:draft.unit,gross_amount_minor:parseRupees(draft.amount),currency:'INR'});
        data={...snapshot,sales:[...snapshot.sales.filter(r=>r.id !== record.id),record]};
      } else {
        const record=validateHarvest({...base,quantity:Number(draft.quantity),unit:draft.unit,harvested_area:draft.area.trim() ? {value:Number(draft.area),unit:draft.areaUnit} : null});
        data={...snapshot,harvests:[...snapshot.harvests.filter(r=>r.id !== record.id),record]};
      }
      if(await persist(data,`${title} saved on this device.`))reset();
    } catch(e){setError(e instanceof Error ? e.message : 'Check the record details.');}
  }
  function edit(r: Expense | Harvest | Sale) {
    const next={...blank(),date:r.date,note:r.note ?? '',demo:r.origin === 'demo'};
    if('amount_minor' in r)Object.assign(next,{amount:rupeeInput(r.amount_minor),category:r.category,kind:r.kind});
    else if('gross_amount_minor' in r)Object.assign(next,{amount:rupeeInput(r.gross_amount_minor),quantity:String(r.quantity),unit:r.unit});
    else Object.assign(next,{quantity:String(r.quantity),unit:r.unit,area:r.harvested_area ? String(r.harvested_area.value) : '',areaUnit:r.harvested_area?.unit ?? 'ha'});
    setDraft(next);setEditing(r.id);setDeletion(null);setError('');setMessage('');formRef.current?.focus();
  }
  async function remove() {
    if(!snapshot || !deletion)return;
    const data=mode === 'expenses' ? {...snapshot,expenses:snapshot.expenses.filter(r=>r.id !== deletion)} : mode === 'sales' ? {...snapshot,sales:snapshot.sales.filter(r=>r.id !== deletion)} : {...snapshot,harvests:snapshot.harvests.filter(r=>r.id !== deletion)};
    if(await persist(data,`${name} deleted from this device.`))reset();
  }
  function summary(demo: boolean) {
    const selected=records.filter(r=>(parentDemo || r.origin === 'demo') === demo);
    if(!selected.length)return <p>{demo ? 'No synthetic entries.' : 'No real entries recorded for this cycle yet.'}</p>;
    if(mode === 'expenses') {
      const totals=expenseTotals(selected as Expense[],cycleId);
      return <><dl className="weather-metrics"><div><dt>Recorded costs</dt><dd>{formatINR(totals.costs)}</dd></div><div><dt>Recorded refunds</dt><dd>{formatINR(totals.refunds)}</dd></div><div><dt>Net recorded outlay</dt><dd>{formatINR(totals.net)}</dd></div></dl><ul>{totals.categories.filter(c=>selected.some(r=>'category' in r && r.category === c.category)).map(c=><li key={c.category}>{c.category}: {formatINR(c.net)}</li>)}</ul></>;
    }
    if(mode === 'sales') {
      const totals=saleTotals(selected as Sale[],cycleId);
      return <dl className="weather-metrics"><div><dt>Recorded gross receipts</dt><dd>{formatINR(totals.received)}</dd></div><div><dt>Recorded sold weight</dt><dd>{totals.mass_kg === null ? 'Unavailable / no weight entries' : `${formatQuantity(totals.mass_kg)} kg`}</dd></div><div><dt>Recorded sold pieces</dt><dd>{totals.has_pieces ? totals.pieces.toLocaleString('en-IN') : 'No count entries'}</dd></div></dl>;
    }
    const totals=harvestTotals(selected as Harvest[],cycleId);
    return <dl className="weather-metrics"><div><dt>Total recorded weight</dt><dd>{totals.mass_kg === null ? 'Unavailable / no weight entries' : `${formatQuantity(totals.mass_kg)} kg`}</dd></div><div><dt>Total recorded pieces</dt><dd>{totals.has_pieces ? totals.pieces.toLocaleString('en-IN') : 'No count entries'}</dd></div><div><dt>Harvest entries</dt><dd>{totals.count}</dd></div></dl>;
  }
  return <div className="farm-workspace"><section className="farm-heading"><div><p className="eyebrow">Your season · on your device</p><h2>{title} diary</h2><p className="lede">{mode === 'expenses' ? 'Track what you spent and any refunds for one crop cycle.' : mode === 'sales' ? 'Record quantities sold and the money actually received for each sale.' : 'Record each picking with its quantity, date and optional harvested area.'}</p></div></section>
    <p className="device-note">Stored locally and included in your farm backup. Clearing browser data can remove these records. {mode === 'expenses' ? 'Recorded costs may be incomplete. Outlay is not profit; sales and unpaid costs are not included.' : mode === 'sales' ? 'Record received money only, not unpaid invoices or deposits. For later payments on the same sale, edit its received amount rather than adding the sold quantity again. This is a cash diary, not profit or stock valuation.' : 'Harvested quantity is not sold quantity. Weights and piece counts stay separate. No yield improvement is attributed to app advice.'}</p>
    {error && <p role="alert" className="form-error">{error} If records changed in another tab, reload before retrying.</p>}<div aria-live="polite">{message && <p className="success-note">{message}</p>}</div>{!snapshot && !error && <p role="status">Loading season records…</p>}
    <label>{title} crop cycle<select disabled={busy} value={cycleId} onChange={e=>{setCycleId(e.target.value);reset();setError('');setMessage('');}}><option value="">Choose a crop cycle</option>{snapshot?.cycles.map(c=><option key={c.id} value={c.id}>{snapshot.fields.find(f=>f.id === c.field_id)?.name} · {c.crop} · {c.status}</option>)}</select></label>
    {snapshot && !snapshot.cycles.length && <p><a className="button button-secondary" href="/farm">Create a crop cycle in My Farm</a> to start your diary.</p>}
    {cycle && <><section className="farm-card"><h3>Cycle summary · {cycle.crop}</h3>{summary(false)}{records.some(r=>parentDemo || r.origin === 'demo') && <div className="location-box"><span className="simulation-label">Synthetic demo totals · separate from real records</span>{summary(true)}</div>}{mode === 'harvests' && <p>Per-area figures apply only to individual entries with recorded area and weight. Repeated pickings may share land, so their areas are not added into a season-yield denominator. Field area is never substituted for missing harvested area.</p>}</section>
      <section className="farm-card" ref={formRef} tabIndex={-1} aria-label={`${name} form`}><h3>{editing ? `Edit ${name}` : `Add ${name}`}</h3>{mode !== 'expenses' && cycle.status === 'planned' && <p>To record a harvest or sale, confirm this cycle is planted in <a className="button button-secondary" href="/farm">My Farm</a> first. A planned cycle cannot have harvest or sale records.</p>}<form onSubmit={e=>void submit(e)}><fieldset disabled={busy}><legend>Record details</legend><div className="farm-grid"><label>{title} date<input required type="date" max={todayInZone(zone)} value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})} /></label>
      {mode === 'expenses' ? <><label>Entry type<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as Expense['kind']})}><option value="cost">Cost</option><option value="refund">Refund</option></select></label><label>Category<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value as Expense['category']})}>{EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Amount (INR ₹)<input required inputMode="decimal" type="text" maxLength={20} value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})} placeholder="e.g. 125.50" /></label></> : <><label>{mode === 'sales' ? 'Sold quantity' : 'Harvest quantity'}<input required type="number" min="0" step={draft.unit === 'piece' ? '1' : 'any'} value={draft.quantity} onChange={e=>setDraft({...draft,quantity:e.target.value})} /></label><label>{mode === 'sales' ? 'Sale unit' : 'Harvest unit'}<select value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value as Harvest['unit']})}>{HARVEST_UNITS.map(u=><option key={u} value={u}>{u === 't' ? 'tonnes (t)' : u === 'piece' ? 'pieces (count)' : u}</option>)}</select></label>{mode === 'sales' ? <label>Gross received amount (INR ₹)<input required inputMode="decimal" type="text" maxLength={20} value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})} placeholder="e.g. 250.50" /></label> : <><label>Harvested area (optional)<input type="number" min="0" step="any" value={draft.area} onChange={e=>setDraft({...draft,area:e.target.value})} /></label><label>Harvested area unit<select value={draft.areaUnit} onChange={e=>setDraft({...draft,areaUnit:e.target.value as typeof draft.areaUnit})}><option value="ha">Hectares</option><option value="acre">Acres</option><option value="m2">Square metres</option></select></label></>}</>}
      </div><label>Note (optional)<textarea maxLength={500} rows={2} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} /></label><label className="check-label"><input type="checkbox" checked={draft.demo || !!forceDemo} disabled={!!forceDemo} onChange={e=>setDraft({...draft,demo:e.target.checked})} />Synthetic demonstration record (excluded from real totals)</label><div className="button-row"><button className="button button-primary" type="submit">{busy ? 'Saving…' : editing ? `Save ${name} changes` : `Save ${name}`}</button>{editing && <button className="text-button" type="button" onClick={reset}>Cancel edit</button>}</div></fieldset></form></section>
      <section className="farm-card"><h3>{records.length} saved {mode}</h3>{!records.length && <p>No {mode} recorded for this cycle.</p>}{records.map(r=><article className="field-item" key={r.id}>{(parentDemo || r.origin === 'demo') && <span className="simulation-label">Synthetic demonstration record</span>}<h4>{r.date} · {'amount_minor' in r ? `${r.kind === 'refund' ? 'Refund' : 'Cost'} · ${r.category}` : 'gross_amount_minor' in r ? 'Sale' : 'Harvest picking'}</h4>{'amount_minor' in r ? <p>{formatINR(BigInt(r.amount_minor))}</p> : 'gross_amount_minor' in r ? <><p>{formatQuantity(r.quantity)} {r.unit === 'piece' ? 'pieces' : r.unit} sold</p><p>Gross received: {formatINR(BigInt(r.gross_amount_minor))}</p></> : <><p>{formatQuantity(r.quantity)} {r.unit === 'piece' ? 'pieces' : r.unit}</p><p>Harvested area: {r.harvested_area ? `${formatQuantity(r.harvested_area.value)} ${r.harvested_area.unit}` : 'unknown'}</p><p>Weight per recorded area for this entry: {harvestYield(r) === null ? 'unavailable (weight and valid area required)' : `${formatQuantity(harvestYield(r)!)} kg/ha`}</p></>}{r.note && <p>{r.note}</p>}<div className="button-row"><button disabled={busy} className="text-button" type="button" onClick={()=>edit(r)}>Edit {name}</button><button disabled={busy} className="text-button" type="button" onClick={()=>setDeletion(r.id)}>Delete {name}</button></div></article>)}</section></>}
    {deletion && <section className="delete-confirm" ref={deleteRef} tabIndex={-1} role="alert"><h3>Delete this {name}?</h3><p>Entry dated {records.find(r=>r.id === deletion)?.date}. This cannot be undone without a backup. Crop and other record types remain.</p><div className="button-row"><button disabled={busy} className="button button-danger" type="button" onClick={()=>void remove()}>Confirm {name} deletion</button><button disabled={busy} className="text-button" type="button" onClick={()=>setDeletion(null)}>Keep {name}</button></div></section>}
  </div>;
}

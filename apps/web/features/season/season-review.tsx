"use client";
import { useEffect, useState } from 'react';
import { type Snapshot } from '@/lib/domain/farm';
import { seasonReview, formatINR, formatQuantity } from '@/lib/domain/season-records';
import { loadFarm } from '@/lib/storage/farm-store';

export function SeasonReview() {
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[cycleId,setCycleId]=useState(''),[error,setError]=useState('');
  useEffect(()=>{let active=true;loadFarm().then(s=>{if(active)setSnapshot(s);}).catch(e=>{if(active)setError(e instanceof Error ? e.message : 'Storage unavailable.');});return()=>{active=false;};},[]);
  const cycle=snapshot?.cycles.find(c=>c.id === cycleId),field=snapshot?.fields.find(f=>f.id === cycle?.field_id);
  function summary(demo:boolean) {
    if(!snapshot || !cycle)return null;
    const review=seasonReview(snapshot,cycle.id,demo);
    if(!review.entryCount)return <p>{demo ? 'No synthetic entries.' : 'No real entries for this cycle yet. Add observations, costs, harvests and sales in Records to build your review.'}</p>;
    const weight=(value:number|null)=>value === null ? 'Unavailable / no weight entries' : `${formatQuantity(value)} kg`;
    const count=(value:bigint,present:boolean)=>present ? value.toLocaleString('en-IN') : 'No count entries';
    return <><h4>Observation coverage</h4><p>{review.observationCount} observations · Latest date: {review.lastObservationDate ?? 'none recorded'}. Notes do not certify crop health or explain yield changes.</p><h4>Money recorded · INR</h4><dl className="weather-metrics"><div><dt>Gross receipts</dt><dd>{review.sold.count ? formatINR(review.sold.received) : 'Unknown / no sales'}</dd></div><div><dt>Costs</dt><dd>{review.hasCosts ? formatINR(review.outlay.costs) : 'Unknown / no costs'}</dd></div><div><dt>Refunds</dt><dd>{formatINR(review.outlay.refunds)}</dd></div><div><dt>Net recorded outlay</dt><dd>{review.hasCosts ? formatINR(review.outlay.net) : 'Unavailable'}</dd></div><div><dt>Receipts minus net outlay</dt><dd>{review.balance === null ? 'Unavailable / costs and sales required' : formatINR(review.balance)}</dd></div></dl>
      <p>These are totals from entered records, not profit. Missing costs, unpaid sales, own labour, losses and opening stock are not inferred.</p>
      <h4>Harvested and sold quantities</h4><dl className="weather-metrics"><div><dt>Harvested weight</dt><dd>{weight(review.harvest.mass_kg)}</dd></div><div><dt>Sold weight</dt><dd>{weight(review.sold.mass_kg)}</dd></div><div><dt>Harvested pieces</dt><dd>{count(review.harvest.pieces,review.harvest.has_pieces)}</dd></div><div><dt>Sold pieces</dt><dd>{count(review.sold.pieces,review.sold.has_pieces)}</dd></div><div><dt>Recorded weight difference</dt><dd>{weight(review.weightDifference)}</dd></div><div><dt>Recorded piece difference</dt><dd>{review.pieceDifference === null ? 'Unavailable / both count records required' : review.pieceDifference.toLocaleString('en-IN')}</dd></div></dl>
      <p>Differences compare diary totals only; they are not available stock. Household use, spoilage and unrecorded pickings can change the real balance. Counts cannot be compared with kilograms. Season yield is unavailable: repeated harvest areas may describe the same land. Per-picking figures remain in Harvests.</p>
      <h4>Record coverage</h4><p>{review.outlay.count} expense/refund entries · {review.harvest.count} harvest entries · {review.sold.count} sales</p>{review.gaps.length ? <ul>{review.gaps.map(gap=><li key={gap}>{gap}</li>)}</ul> : <p>Each diary has entries. This does not certify that every cost, picking or sale has been recorded.</p>}
    </>;
  }
  const hasDemo=!!snapshot && !!cycle && seasonReview(snapshot,cycle.id,true).entryCount > 0;
  return <div className="farm-workspace"><section className="farm-heading"><div><p className="eyebrow">Improve · review your records</p><h2>Season review</h2><p className="lede">Compare the costs, receipts and quantities you entered for one crop cycle.</p></div></section><p className="device-note">This review uses local records only. No market prices, yield forecast or agricultural recommendations are inferred. Reopen this view after editing a diary to load the latest entries.</p>
    {error && <p role="alert" className="form-error">{error}</p>}{!snapshot && !error && <p role="status">Loading your season…</p>}
    <label>Review crop cycle<select value={cycleId} onChange={e=>setCycleId(e.target.value)}><option value="">Choose a crop cycle</option>{snapshot?.cycles.map(c=><option key={c.id} value={c.id}>{snapshot.fields.find(f=>f.id === c.field_id)?.name} · {c.crop} · {c.status}</option>)}</select></label>
    {snapshot && !snapshot.cycles.length && <p><a href="/farm">Create a crop cycle in My Farm</a> to begin.</p>}
    {cycle && <section className="farm-card"><h3>{cycle.crop} · {field?.name}</h3><p>Status: {cycle.status} · Sowing: {cycle.sowing_date ?? 'unknown'} · Season: {cycle.season ?? 'unknown'}</p><h4>Real record totals</h4>{summary(false)}{hasDemo && <div className="location-box"><span className="simulation-label">Synthetic demonstration review · separate from real records</span>{summary(true)}</div>}<p>Use Observations, Expenses, Harvests or Sales above to add missing entries or correct mistakes. Use <a href="/farm">My Farm</a> for cycle details and a backup.</p></section>}
  </div>;
}

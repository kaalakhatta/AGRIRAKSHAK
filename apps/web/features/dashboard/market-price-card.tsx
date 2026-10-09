"use client";
import { useEffect, useId, useState } from 'react';
import { marketCrop, type MarketReport, type PricePoint } from '@/lib/providers/market-prices';
import { initialMarket, readMarketOrder } from '@/lib/providers/nearest-market';
import { MARKET_TOWNS_SOURCE } from '@/lib/providers/market-towns';
import { type MapPoint } from '@/lib/providers/field-context';
import { todayInZone } from '@/lib/domain/farm';
const rupees = (value:number)=>`₹${value.toLocaleString('en-IN',{maximumFractionDigits:2})}`;
function modalRange(point:PricePoint) {return point.modals.length>1 ? `${rupees(point.modals[0])} – ${rupees(point.modals.at(-1)!)}` : rupees(point.modals[0]);}
export function MarketPriceCard({crop,region,point=null,fieldId}:{crop:string;region:string|null;point?:MapPoint|null;fieldId:string}) {
  const id=useId(), key=marketCrop(crop);
  const [report,setReport]=useState<MarketReport|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[refresh,setRefresh]=useState(0);
  const [selection,setSelection]=useState<{market:string;variety:string;reason:string}>({market:'',variety:'',reason:''});
  const {market,variety}=selection;
  useEffect(()=>{
    if(!key)return;
    const abort=new AbortController();let live=true;
    const start=setTimeout(()=>{setLoading(true);setError('');setReport(null);},0);
    fetch(`/api/market-prices?crop=${key}`,{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]),cache:'no-store',credentials:'omit'}).then(async response=>{
      if(!response.ok)throw Error('Agmarknet is unavailable. Try again when connected.');
      const data=await response.json() as MarketReport;
      if(data.crop!==key||data.unit!=='INR/quintal'||!Array.isArray(data.series))throw Error('Unsupported market report.');
      if(live){setReport(data);setSelection(previous=>{
        let remembered:string[]=[];try{remembered=readMarketOrder(sessionStorage,fieldId);}catch{/* Tab storage can be blocked. */}
        const defaultMarket=initialMarket(data.series,region,point,remembered);
        const retained=data.series.some(s=>s.market===previous.market);
        const chosen=retained?previous.market:defaultMarket.market;
        const choices=data.series.filter(s=>s.market===chosen).sort((a,b)=>(b.points.at(-1)?.date??'').localeCompare(a.points.at(-1)?.date??'')||a.variety.localeCompare(b.variety));
        return {market:chosen,reason:retained?previous.reason:defaultMarket.reason,variety:choices.some(s=>s.variety===previous.variety)?previous.variety:choices[0]?.variety??''};
      });}
    }).catch(failure=>{if(live)setError(failure instanceof Error?failure.message:'Prices unavailable.');}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;abort.abort();clearTimeout(start);};
  },[key,region,refresh,point,fieldId]);
  const markets=[...new Set(report?.series.map(s=>s.market)??[])];
  const varieties=report?.series.filter(s=>s.market===market)??[];
  const selected=varieties.find(s=>s.variety===variety)??(varieties.length===1?varieties[0]:null),points=selected?.points??[],latest=points.at(-1);
  const stale=latest ? Date.parse(todayInZone('Asia/Kolkata'))-Date.parse(latest.date)>3*86400000 : false;
  const values=points.flatMap(p=>p.modals),bottom=values.length?Math.min(...values):0,top=values.length?Math.max(...values):1;
  const pad=Math.max((top-bottom)*.18,100),low=Math.max(0,bottom-pad),high=top+pad;
  const first=points[0]?Date.parse(points[0].date):0,last=latest?Date.parse(latest.date):0;
  const x=(date:string)=>50+(Date.parse(date)-first)/Math.max(last-first,86400000)*590;
  const y=(value:number)=>190-(value-low)/(high-low)*150;
  return <section id="prices" className="dashboard-card market-card" aria-labelledby={`${id}-title`}>
    <div className="dashboard-card-heading"><div><p className="eyebrow">Madhya Pradesh · mandi reports</p><h2 id={`${id}-title`}>{crop} prices</h2></div><button type="button" className="button button-secondary" disabled={loading||!key} onClick={()=>setRefresh(n=>n+1)}>{loading?'Checking…':'Refresh prices'}</button></div>
    {!key&&<p>Official market matching is available for soybean, wheat and gram/chickpea.</p>}{loading&&<p role="status">Loading official daily reports…</p>}{error&&<p role="status" className="empty-state">{error} No replacement prices are shown.</p>}
    {report&&<>{selection.reason==='nearby'?<p className="dashboard-caption">Auto-selected the nearest mapped mandi town with {crop} reports. Distances use town centres, so the closest actual mandi may differ. <a href={MARKET_TOWNS_SOURCE} target="_blank" rel="noreferrer">GeoNames · CC BY 4.0</a>. Your field coordinates stay on this device.</p>:selection.reason==='district'?<p className="dashboard-caption">Selected a reporting mandi in your district. Add a confirmed field point to choose by approximate distance.</p>:selection.reason==='latest'?<p className="dashboard-caption">No mapped local match is available; showing the most recent reporting MP mandi. Change the mandi below.</p>:null}<div className="dashboard-inputs"><label>Mandi<select value={market} onChange={e=>{const next=e.target.value;const choices=report.series.filter(s=>s.market===next).sort((a,b)=>(b.points.at(-1)?.date??'').localeCompare(a.points.at(-1)?.date??'')||a.variety.localeCompare(b.variety));setSelection({market:next,variety:choices[0]?.variety??'',reason:'manual'});}}><option value="">Choose a mandi</option>{markets.map(name=><option key={name}>{name}</option>)}</select></label><label>Market variety <span>(mandi grade, not your seed variety)</span><select value={selected?.variety??variety} disabled={!market} onChange={e=>setSelection({...selection,variety:e.target.value})}><option value="">Choose a reported variety</option>{varieties.map(s=><option key={s.variety}>{s.variety}</option>)}</select></label></div>
      {latest?<><div className="price-summary"><div><span className="dashboard-caption">Latest reported modal {latest.modals.length>1?'range':'price'}</span><strong>{modalRange(latest)}</strong><span>per quintal (100 kg)</span></div><div><span className={stale?'status-chip status-stale':'status-chip'}>{stale?'Older report':'Recent report'}</span><p>{latest.date} · {market} · {selected?.variety}</p><p>Reported min–max: {rupees(latest.minimum)} – {rupees(latest.maximum)}</p></div></div>
      <figure className="price-chart"><figcaption>Reported modal prices · available dates in the last 30 days</figcaption><svg viewBox="0 0 680 240" role="img" aria-labelledby={`${id}-chart-title ${id}-chart-desc`}><title id={`${id}-chart-title`}>{crop} price history at {market}</title><desc id={`${id}-chart-desc`}>Each dot is a reported modal price in rupees per quintal. Vertical bars join multiple reports for one date. Missing days are not interpolated. Values are available in the table below.</desc>{[0,.5,1].map(f=>{const v=low+(high-low)*f;return <g key={f}><line x1="50" x2="650" y1={y(v)} y2={y(v)} className="chart-grid"/><text x="45" y={y(v)+4} textAnchor="end">{Math.round(v)}</text></g>;})}{points.map(point=><g key={point.date}>{point.modals.length>1&&<line x1={x(point.date)} x2={x(point.date)} y1={y(point.modals[0])} y2={y(point.modals.at(-1)!)} className="chart-range"/>}{point.modals.map(value=><circle key={value} cx={x(point.date)} cy={y(value)} r="4.5" className="chart-point"><title>{point.date}: {rupees(value)} / quintal</title></circle>)}</g>)}<text x="50" y="218">{points[0]?.date}</text><text x="640" y="218" textAnchor="end">{latest.date}</text><text x="350" y="237" textAnchor="middle">₹ per quintal · report date</text></svg></figure>
      <details className="dashboard-details"><summary>View price history table ({points.length} report dates)</summary><div className="dashboard-table-scroll"><table><caption>{market} · {selected?.variety} · INR per quintal</caption><thead><tr><th scope="col">Report date</th><th scope="col">Modal price(s)</th><th scope="col">Min–max</th></tr></thead><tbody>{[...points].reverse().map(p=><tr key={p.date}><td>{p.date}</td><td>{p.modals.map(rupees).join(', ')}</td><td>{rupees(p.minimum)} – {rupees(p.maximum)}</td></tr>)}</tbody></table></div></details><p className="dashboard-caption">Multiple same-day reports remain separate price points; no average is invented. This is a daily mandi report, not a guaranteed offer or a real-time trade feed.</p></>:<p className="empty-state">{markets.length?'Choose a mandi and market variety to see its price and graph.':'No valid reports in this 30-day window.'}</p>}
      <p className="dashboard-caption">{report.partial?'Some monthly reports are unavailable. ':''}Retrieved {new Date(report.fetched_at).toLocaleString('en-IN')} · <a href={report.source} target="_blank" rel="noreferrer">Official Agmarknet source</a>. Report dates can lag; refresh requires a connection.</p></>}
  </section>;
}

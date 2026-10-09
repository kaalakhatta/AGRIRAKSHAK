"use client";
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { consumeDashboardContext, type DashboardContext } from '@/lib/providers/dashboard-context';
import { DocumentLink } from '@/components/document-link';
import { type Snapshot, type FarmData, type Field, type CropCycle } from '@/lib/domain/farm';
import { loadFarm, saveFarm } from '@/lib/storage/farm-store';
import { type Weather } from '@/lib/providers/weather';
import { SchemeMatcher } from '@/features/support/scheme-matcher';
import { ScenarioCalculator } from '@/features/planning/scenario-calculator';
import { CalendarPanel } from '@/features/calendar/calendar-panel';
import { MarketPriceCard } from './market-price-card';
import { CropNotes } from './crop-notes';
import { SeasonCalendar } from './season-calendar';
import { FieldEnvironment } from './field-environment';
import { QuickInfo } from './crop-dashboard';
function SelectedDashboard({snapshot,field,cycle,busy,save,context}:{context:DashboardContext|null;snapshot:Snapshot;field:Field;cycle:CropCycle;busy:boolean;save:(data:FarmData,message:string)=>Promise<boolean>}) {
  const [weather,setWeather]=useState<Weather|null>(context?.weather??null);
  const timezone=snapshot.farms.find(f=>f.id===field.farm_id)?.timezone??'Asia/Kolkata';
  function jump(event:MouseEvent<HTMLAnchorElement>,section:string){
    event.preventDefault();history.replaceState(null,'',`#${new URLSearchParams({field:field.id,cycle:cycle.id,section:section.slice(1)})}`);document.getElementById(section.slice(1))?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  return <><nav className="dashboard-section-links" aria-label="Dashboard sections">{[["#forecast","Forecast"],["#soil","Soil"],["#season-calendar","Season calendar"],["#schemes","Schemes"],["#calculator","Profit calculator"]].map(([href,label])=><DocumentLink key={href} href={href} onClick={event=>jump(event,href)}>{label}</DocumentLink>)}</nav><QuickInfo snapshot={snapshot} field={field} cycle={cycle} weather={weather}/><FieldEnvironment snapshot={snapshot} field={field} initialWeather={context?.weather??null} initialSoil={context?.soil??null} onWeather={setWeather}/><div className="crop-dashboard-grid"><MarketPriceCard crop={cycle.crop} region={field.region}/><CropNotes field={field} cycle={cycle}/></div><SeasonCalendar field={field} cycle={cycle} tasks={snapshot.tasks} weather={weather} initialView="today"/><details className="dashboard-details reminder-details"><summary>Add or manage season reminders</summary><CalendarPanel snapshot={snapshot} cycle={cycle} timezone={timezone} busy={busy} save={save}/></details><section id="schemes" className="dashboard-card dashboard-schemes"><p className="eyebrow">Central & Madhya Pradesh support</p><h2>Government schemes for {field.name}</h2><p>Matched to your saved field and crop. Answer the extra eligibility questions to narrow the potential matches.</p><SchemeMatcher key={`${field.id}:${field.updated_at}:${cycle.id}`} field={field} cycle={cycle}/></section><div className="dashboard-card dashboard-calculator"><ScenarioCalculator field={field}/></div></>;
}
export function FarmDashboard() {
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[fieldId,setFieldId]=useState(''),[cycleId,setCycleId]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const saving=useRef(false);
  const [context,setContext]=useState<DashboardContext|null>(null);
  useEffect(()=>{let live=true;loadFarm().then(data=>{if(!live)return;setSnapshot(data);const params=new URLSearchParams(window.location.hash.slice(1)),f=data.fields.find(f=>f.id===params.get('field'))??data.fields[0];setFieldId(f?.id??'');const c=data.cycles.find(c=>c.field_id===f?.id&&c.id===params.get('cycle'))??data.cycles.find(c=>c.field_id===f?.id&&c.status!=='archived');setCycleId(c?.id??'');if(f&&c){try{setContext(consumeDashboardContext(sessionStorage,f.id,c.id,Date.now()));}catch{/* No online context transfer available. */}}}).catch(()=>{if(live)setError('Local farm records could not be loaded. Retry without clearing browser storage.');});return()=>{live=false;};},[]);
  async function save(data:FarmData,note:string) {
    if(!snapshot||saving.current)return false;saving.current=true;setBusy(true);setError('');setMessage('');
    try{setSnapshot(await saveFarm(data,snapshot.revision));setMessage(note);return true;}catch(cause){setError(cause instanceof Error?cause.message:'Could not save.');return false;}finally{saving.current=false;setBusy(false);}
  }
  function chooseField(id:string){
    const next=snapshot?.cycles.find(c=>c.field_id===id&&c.status!=='archived')?.id??'';
    setContext(null);setFieldId(id);setCycleId(next);setMessage('');history.replaceState(null,'',`#${new URLSearchParams({field:id,cycle:next})}`);
  }
  function chooseCycle(id:string){setContext(null);setCycleId(id);setMessage('');history.replaceState(null,'',`#${new URLSearchParams({field:fieldId,cycle:id})}`);}
  const field=snapshot?.fields.find(f=>f.id===fieldId),cycles=snapshot?.cycles.filter(c=>c.field_id===fieldId)??[],cycle=cycles.find(c=>c.id===cycleId);
  return <div className="farm-dashboard"><div className="dashboard-welcome"><div><p className="eyebrow">My farm · Plan, monitor, improve</p><h1>Your farm dashboard.</h1><p>{field?`${field.name} · ${field.region??'Region unknown'}`:'Connect a field to bring your season together.'}</p></div><DocumentLink href={field?"/farm#manage-fields":"/farm"} className="button button-primary">{field?'Manage my fields':'Set up my first field'} →</DocumentLink></div>{error&&<p role="alert" className="form-error">{error}</p>}{message&&<p role="status" className="success-note">{message}</p>}{!snapshot&&!error&&<p role="status">Loading your local farm…</p>}{snapshot&&<><div className="dashboard-selector"><div className="dashboard-inputs"><label>Your field<select disabled={busy} value={fieldId} onChange={e=>chooseField(e.target.value)}><option value="">Choose a field</option>{snapshot.fields.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Crop cycle<select disabled={busy||!field} value={cycleId} onChange={e=>chooseCycle(e.target.value)}><option value="">Choose a crop cycle</option>{cycles.map(c=><option key={c.id} value={c.id}>{c.crop} · {c.season??'season unknown'} · {c.status}</option>)}</select></label></div>{field&&cycle&&<div className="dashboard-field-facts"><span>{cycle.variety??'Variety unknown'}</span><span>Sowing: {cycle.sowing_date??'not recorded'}</span><span>{field.area?`${field.area.value} ${field.area.unit}`:'Area unknown'}</span><span>Water: {field.water}</span></div>}</div>{field&&cycle?<SelectedDashboard key={`${field.id}:${field.updated_at}:${cycle.id}:${cycle.updated_at}`} snapshot={snapshot} field={field} cycle={cycle} busy={busy} save={save} context={context?.field_id===field.id&&context?.cycle_id===cycle.id?context:null}/>:<p className="empty-state">Choose a saved field and crop cycle, or set up a field to see its dashboard.</p>}</>}</div>;
}

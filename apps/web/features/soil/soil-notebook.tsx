"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { newMeta, todayInZone, type Snapshot } from '@/lib/domain/farm';
import { SOIL_METRICS, validateSoilTest, type SoilMetric, type SoilTest } from '@/lib/domain/soil';
import { loadFarm, saveFarm } from '@/lib/storage/farm-store';

const metricIds = Object.keys(SOIL_METRICS) as SoilMetric[];
const blank = () => ({ date:'', source:'', kind:'soil_lab' as SoilTest['source_kind'], top:'', bottom:'', demo:false, readings:Object.fromEntries(metricIds.map(m=>[m,{value:'',method:''}])) as Record<SoilMetric,{value:string;method:string}> });
export function SoilNotebook() {
  const [snapshot,setSnapshot] = useState<Snapshot | null>(null), [fieldId,setFieldId] = useState('');
  const [draft,setDraft] = useState(blank), [editing,setEditing] = useState<string | null>(null), [deletion,setDeletion] = useState<string | null>(null);
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [message,setMessage] = useState('');
  const operation = useRef(false), formRef = useRef<HTMLElement>(null), deleteRef = useRef<HTMLElement>(null);
  useEffect(()=>{let active=true;loadFarm().then(s=>{if(active)setSnapshot(s);}).catch(e=>{if(active)setError(e instanceof Error ? e.message : 'Storage unavailable.');});return()=>{active=false;};},[]);
  useEffect(()=>{if(deletion)deleteRef.current?.focus();},[deletion]);
  const field = snapshot?.fields.find(f=>f.id === fieldId);
  const zone = snapshot?.farms.find(f=>f.id === field?.farm_id)?.timezone ?? 'UTC';
  const tests = (snapshot?.soil_tests.filter(t=>t.field_id === fieldId) ?? []).sort((a,b)=>b.sample_date.localeCompare(a.sample_date) || a.id.localeCompare(b.id));
  function reset() {setDraft(blank());setEditing(null);setDeletion(null);}
  async function persist(tests: SoilTest[], success: string) {
    if (!snapshot || operation.current) return false;
    operation.current=true;setBusy(true);setError('');setMessage('');
    try {setSnapshot(await saveFarm({...snapshot,soil_tests:tests},snapshot.revision));setMessage(success);return true;}
    catch(e){setError(e instanceof Error ? e.message : 'Could not save records.');return false;}
    finally{operation.current=false;setBusy(false);}
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!snapshot || !field || operation.current)return;
    try {
      const previous = snapshot.soil_tests.find(t=>t.id === editing), now = new Date().toISOString();
      if (!!draft.top.trim() !== !!draft.bottom.trim()) throw new Error('Enter both depth limits, or leave both unknown.');
      const readings = metricIds.filter(m=>draft.readings[m].value.trim()).map(m=>({metric:m,value:Number(draft.readings[m].value),unit:SOIL_METRICS[m].unit,method:draft.readings[m].method.trim() || null}));
      if (metricIds.some(m=>!draft.readings[m].value.trim() && draft.readings[m].method.trim())) throw new Error('A test method needs a measured value in the same row.');
      const soil = validateSoilTest({...(previous ?? newMeta(now)),updated_at:now,origin:draft.demo || field.origin === 'demo' || previous?.origin === 'demo' ? 'demo' : previous?.origin === 'import' ? 'import' : 'user',field_id:field.id,sample_date:draft.date,source_kind:draft.kind,source:draft.source.trim(),depth_cm:draft.top.trim() ? {top:Number(draft.top),bottom:Number(draft.bottom)} : null,readings});
      if(await persist([...snapshot.soil_tests.filter(t=>t.id !== soil.id),soil], 'Soil test saved on this device.'))reset();
    } catch(e){setError(e instanceof Error ? e.message : 'Check the soil test details.');}
  }
  function edit(t: SoilTest) {
    setEditing(t.id);setDeletion(null);setError('');setMessage('');
    setDraft({date:t.sample_date,source:t.source,kind:t.source_kind,top:t.depth_cm ? String(t.depth_cm.top) : '',bottom:t.depth_cm ? String(t.depth_cm.bottom) : '',demo:t.origin === 'demo',readings:Object.fromEntries(metricIds.map(m=>{const r=t.readings.find(r=>r.metric === m);return [m,{value:r ? String(r.value) : '',method:r?.method ?? ''}];})) as ReturnType<typeof blank>['readings']});
    formRef.current?.focus();
  }
  async function remove() {if(snapshot && deletion && await persist(snapshot.soil_tests.filter(t=>t.id !== deletion),'Soil test deleted from this device.'))reset();}
  return <div className="farm-workspace" id="soil"><section className="farm-heading"><div><p className="eyebrow">Measured values · entered by you</p><h2>Your soil notebook</h2><p className="lede">Copy results from a lab report or manual test. Keep the original units and method; leave unknown details blank.</p></div></section>
    <p className="device-note">Saved locally and included in your farm backup. No report uploads, photos or coordinates are stored with a test. Values are self-reported, not independently verified. No fertilizer or irrigation dosage is calculated.</p>
    {error && <p role="alert" className="form-error">{error} If records changed in another tab, reload before retrying.</p>}<div aria-live="polite">{message && <p className="success-note">{message}</p>}</div>
    {!snapshot && !error && <p role="status">Loading soil records…</p>}
    <label>Soil test field<select disabled={busy} value={fieldId} onChange={e=>{setFieldId(e.target.value);reset();setMessage('');setError('');}}><option value="">Choose a field</option>{snapshot?.fields.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    {snapshot && !snapshot.fields.length && <p><a href="/farm">Add a field in My Farm</a> before recording a soil test.</p>}
    {field && <><section className="farm-card" ref={formRef} tabIndex={-1} aria-label="Soil test form"><h3>{editing ? 'Edit soil test' : 'Add a soil test'}</h3><form onSubmit={e=>void submit(e)}><fieldset disabled={busy} className="soil-form"><legend>Sample details</legend><div className="farm-grid">
      <label>Sample date<input required type="date" max={todayInZone(zone)} value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})} /></label>
      <label>Test source<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as SoilTest['source_kind']})}><option value="soil_lab">Soil laboratory report</option><option value="manual_test">Manual test / test kit</option></select></label>
      <label>Lab or test source name<input required maxLength={120} value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})} placeholder="Name from your report or test kit" /></label>
      <div><p>Sample depth (cm) · optional</p><label>Top depth (cm)<input type="number" min="0" step="any" value={draft.top} onChange={e=>setDraft({...draft,top:e.target.value})} /></label><label>Bottom depth (cm)<input type="number" min="0" step="any" value={draft.bottom} onChange={e=>setDraft({...draft,bottom:e.target.value})} /></label></div>
    </div><p>Enter at least one property. These units must match your report. Other units and nutrients are not supported yet; do not relabel or guess a conversion. Unknown values stay blank.</p>
      {metricIds.map(m=><div className="farm-grid" key={m}><label>{SOIL_METRICS[m].label} ({SOIL_METRICS[m].unit === 'g_kg' ? 'g/kg' : SOIL_METRICS[m].unit === 'percent' ? '%' : 'pH'})<input type="number" min="0" max={SOIL_METRICS[m].maximum} step="any" value={draft.readings[m].value} onChange={e=>setDraft({...draft,readings:{...draft.readings,[m]:{...draft.readings[m],value:e.target.value}}})} /></label><label>{SOIL_METRICS[m].label} test method (optional)<input maxLength={120} value={draft.readings[m].method} onChange={e=>setDraft({...draft,readings:{...draft.readings,[m]:{...draft.readings[m],method:e.target.value}}})} placeholder="As stated on the report; blank if unknown" /></label></div>)}
      <label className="check-label"><input type="checkbox" checked={draft.demo || field.origin === 'demo'} disabled={field.origin === 'demo' || snapshot?.soil_tests.find(t=>t.id === editing)?.origin === 'demo'} onChange={e=>setDraft({...draft,demo:e.target.checked})} />Synthetic demonstration values (never treated as real measurements)</label>
      <div className="button-row"><button type="submit" className="button button-primary">{busy ? 'Saving…' : editing ? 'Save soil test changes' : 'Save soil test'}</button>{editing && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div></fieldset></form></section>
      <section className="farm-card"><h3>{tests.length} saved soil {tests.length === 1 ? 'test' : 'tests'} · {field.name}</h3>{!tests.length && <p>No measurements recorded for this field. GPS and weather cannot supply a soil test.</p>}{tests.map(t=><article className="field-item" key={t.id}>{t.origin === 'demo' && <span className="simulation-label">Synthetic demo · not field evidence</span>}<h4>{t.source} · sampled {t.sample_date}</h4><p>{t.source_kind === 'soil_lab' ? 'Lab report entered by you' : 'Manual test entered by you'} · depth {t.depth_cm ? `${t.depth_cm.top}–${t.depth_cm.bottom} cm` : 'unknown'}</p><ul>{t.readings.map(r=><li key={r.metric}>{SOIL_METRICS[r.metric].label}: {r.value} {r.unit === 'g_kg' ? 'g/kg' : r.unit === 'percent' ? '%' : 'pH'} · method: {r.method ?? 'unknown'}</li>)}</ul><p>Sample age and method must be checked against a reviewed rule before future advice. Saving or editing does not make an old sample new.</p><div className="button-row"><button disabled={busy} type="button" className="text-button" onClick={()=>edit(t)}>Edit soil test</button><button disabled={busy} type="button" className="text-button" onClick={()=>setDeletion(t.id)}>Delete soil test</button></div></article>)}</section></>}
    {deletion && <section className="delete-confirm" ref={deleteRef} tabIndex={-1} role="alert"><h3>Delete this soil test?</h3><p>{snapshot?.soil_tests.find(t=>t.id === deletion)?.source} · {snapshot?.soil_tests.find(t=>t.id === deletion)?.sample_date}. This cannot be undone without a backup. Field and crop records remain.</p><div className="button-row"><button disabled={busy} type="button" className="button button-danger" onClick={()=>void remove()}>Confirm soil test deletion</button><button disabled={busy} type="button" className="text-button" onClick={()=>setDeletion(null)}>Keep soil test</button></div></section>}
  </div>;
}

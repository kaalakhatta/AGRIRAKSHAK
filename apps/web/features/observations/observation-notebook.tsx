"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { newMeta, todayInZone, type Snapshot } from '@/lib/domain/farm';
import { OBSERVATION_TAGS, validateObservation, isSyntheticObservation, observationHistory, type Observation, type ObservationTag } from '@/lib/domain/observations';
import { loadFarm, saveFarm } from '@/lib/storage/farm-store';

const blank=()=>({date:'',note:'',tags:[] as ObservationTag[],scan:'',demo:false});
export function ObservationNotebook() {
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[cycleId,setCycleId]=useState('');
  const [draft,setDraft]=useState(blank),[editing,setEditing]=useState<string|null>(null),[deletion,setDeletion]=useState<string|null>(null),[tagFilter,setTagFilter]=useState('all');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const operation=useRef(false),formRef=useRef<HTMLElement>(null),deleteRef=useRef<HTMLElement>(null);
  useEffect(()=>{let active=true;loadFarm().then(s=>{if(active)setSnapshot(s);}).catch(e=>{if(active)setError(e instanceof Error ? e.message : 'Storage unavailable.');});return()=>{active=false;};},[]);
  useEffect(()=>{if(deletion)deleteRef.current?.focus();},[deletion]);
  const cycle=snapshot?.cycles.find(c=>c.id===cycleId),field=snapshot?.fields.find(f=>f.id===cycle?.field_id),farm=snapshot?.farms.find(f=>f.id===field?.farm_id);
  const existing=snapshot?.observations.find(o=>o.id===editing),linkedScan=snapshot?.scans.find(s=>s.id===draft.scan);
  const forceDemo=[cycle,field,farm,linkedScan].some(r=>r?.origin==='demo') || linkedScan?.availability==='simulation' || !!(snapshot && existing && isSyntheticObservation(snapshot,existing));
  const real=snapshot ? observationHistory(snapshot,cycleId,false) : [],demo=snapshot ? observationHistory(snapshot,cycleId,true) : [];
  const rows=[...real,...demo].sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id)).filter(o=>tagFilter==='all' || o.tags.includes(tagFilter as ObservationTag));
  function reset(){setDraft(blank());setEditing(null);setDeletion(null);}
  async function persist(observations:Observation[],success:string) {
    if(!snapshot || operation.current)return false;operation.current=true;setBusy(true);setError('');setMessage('');
    try{setSnapshot(await saveFarm({...snapshot,observations},snapshot.revision));setMessage(success);return true;}
    catch(e){setError(e instanceof Error ? e.message : 'Could not save observations.');return false;}
    finally{operation.current=false;setBusy(false);}
  }
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!snapshot || !cycle || operation.current)return;
    try{
      const now=new Date().toISOString(),observation=validateObservation({...(existing ?? newMeta(now)),updated_at:now,origin:forceDemo || draft.demo ? 'demo' : existing?.origin==='import' ? 'import' : 'user',cycle_id:cycle.id,date:draft.date,note:draft.note.trim(),tags:draft.tags,scan_summary_id:draft.scan || null});
      if(await persist([...snapshot.observations.filter(o=>o.id!==observation.id),observation],'Observation saved on this device.'))reset();
    }catch(e){setError(e instanceof Error ? e.message : 'Check your observation.');}
  }
  function edit(o:Observation){setDraft({date:o.date,note:o.note,tags:[...o.tags],scan:o.scan_summary_id ?? '',demo:!!snapshot && isSyntheticObservation(snapshot,o)});setEditing(o.id);setDeletion(null);setError('');setMessage('');formRef.current?.focus();}
  async function remove(){if(snapshot && deletion && await persist(snapshot.observations.filter(o=>o.id!==deletion),'Observation deleted from this device.'))reset();}
  return <div className="farm-workspace"><section className="farm-heading"><div><p className="eyebrow">Monitor · your field notes</p><h2>Crop observations</h2><p className="lede">Write what you saw and when, for one field and crop cycle.</p></div></section>
    <p className="device-note">Notes stay on this device and are included in your farm backup. Keep photos, precise locations and personal details out of notes. Tags describe observations; they do not confirm a disease or trigger treatment advice.</p>
    {error && <p className="form-error" role="alert">{error} If another tab changed your records, reload before retrying.</p>}<div aria-live="polite">{message && <p className="success-note">{message}</p>}</div>{!snapshot && !error && <p role="status">Loading observations…</p>}
    <label>Observation crop cycle<select disabled={busy} value={cycleId} onChange={e=>{setCycleId(e.target.value);reset();setTagFilter('all');setError('');setMessage('');}}><option value="">Choose a crop cycle</option>{snapshot?.cycles.map(c=><option key={c.id} value={c.id}>{snapshot.fields.find(f=>f.id===c.field_id)?.name} · {c.crop} · {c.status}</option>)}</select></label>
    {snapshot && !snapshot.cycles.length && <p><a href="/farm">Create a crop cycle in My Farm</a> to begin your notebook.</p>}
    {cycle && <><section className="farm-card"><h3>Cycle notes · {cycle.crop}</h3><p>{field?.name} · {real.length} real observations · {demo.length} synthetic observations</p><p>Latest real observation: {real[0]?.date ?? 'none recorded'}. No note means unknown conditions, not a healthy crop.</p></section>
      <section className="farm-card" ref={formRef} tabIndex={-1} aria-label="Observation form"><h3>{editing ? 'Edit observation' : 'Add an observation'}</h3><form onSubmit={e=>void submit(e)}><fieldset disabled={busy}><legend>What you observed</legend><label>Observation date<input required type="date" max={todayInZone(farm?.timezone ?? 'UTC')} value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})} /></label><label>Field note<textarea required rows={4} maxLength={1000} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder="Describe what you saw, where on the plant, and any changes since your last visit." /></label>
      <fieldset><legend>Descriptive tags (optional)</legend>{OBSERVATION_TAGS.map(tag=><label key={tag} className="check-label"><input type="checkbox" checked={draft.tags.includes(tag)} onChange={e=>setDraft({...draft,tags:e.target.checked ? [...draft.tags,tag] : draft.tags.filter(t=>t!==tag)})} />{tag}</label>)}</fieldset>
      <label>Screening reference (optional)<select value={draft.scan} onChange={e=>setDraft({...draft,scan:e.target.value})}><option value="">No screening reference</option>{snapshot?.scans.filter(s=>s.cycle_id===cycle.id).map(s=><option key={s.id} value={s.id}>{new Date(s.screened_at).toLocaleString('en',{timeZone:farm?.timezone ?? 'UTC'})} · {s.availability==='simulation' ? `Interface demo: ${s.demo_label}` : 'Model unavailable'} · {s.model_version}</option>)}</select></label>
      <p>Only summaries saved against this cycle can be linked. Current screening is a demonstration or unavailable. Linking a demo makes the entire observation synthetic; it does not add a diagnosis.</p>
      <label className="check-label"><input type="checkbox" checked={draft.demo || forceDemo} disabled={forceDemo} onChange={e=>setDraft({...draft,demo:e.target.checked})} />Synthetic demonstration observation (excluded from real history)</label><div className="button-row"><button className="button button-primary" type="submit">{busy ? 'Saving…' : editing ? 'Save observation changes' : 'Save observation'}</button>{editing && <button className="text-button" type="button" onClick={reset}>Cancel edit</button>}</div></fieldset></form></section>
      <section className="farm-card"><h3>Observation history</h3><label>Filter observation tag<select disabled={busy} value={tagFilter} onChange={e=>setTagFilter(e.target.value)}><option value="all">All tags</option>{OBSERVATION_TAGS.map(t=><option key={t}>{t}</option>)}</select></label><p>{rows.length} notes shown · latest observation date first</p>{!rows.length && <p>No observations match this selection.</p>}{rows.map(o=>{const scan=snapshot!.scans.find(s=>s.id===o.scan_summary_id);return <article className="field-item" key={o.id}>{isSyntheticObservation(snapshot!,o) && <span className="simulation-label">Synthetic demonstration observation · not field evidence</span>}<h4>Observed {o.date}</h4><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{o.note}</p><p>Tags: {o.tags.length ? o.tags.join(' · ') : 'none recorded'}</p>{scan ? <p>Screening reference: {scan.availability==='simulation' ? `Interface demo: ${scan.demo_label}` : 'Model unavailable'} · {scan.model_version} · {new Date(scan.screened_at).toLocaleString('en',{timeZone:farm?.timezone ?? 'UTC'})}. No diagnosis or confidence recorded.</p> : <p>No screening reference.</p>}<div className="button-row"><button disabled={busy} className="text-button" type="button" onClick={()=>edit(o)}>Edit observation</button><button disabled={busy} className="text-button" type="button" onClick={()=>setDeletion(o.id)}>Delete observation</button></div></article>;})}</section></>}
    {deletion && <section className="delete-confirm" ref={deleteRef} tabIndex={-1} role="alert"><h3>Delete this observation?</h3><p>Observed {snapshot?.observations.find(o=>o.id===deletion)?.date}. This cannot be undone without a backup. Screening summaries and other records remain.</p><div className="button-row"><button disabled={busy} className="button button-danger" type="button" onClick={()=>void remove()}>Confirm observation deletion</button><button disabled={busy} className="text-button" type="button" onClick={()=>setDeletion(null)}>Keep observation</button></div></section>}
  </div>;
}

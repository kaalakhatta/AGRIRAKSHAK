"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CYCLE_STATUSES, STAGES, WATER_OPTIONS, emptyData, makeBackup, newMeta, parseBackup, planImport, removeField, removeCycle, validateCoordinates, validateData, type Backup, type Coordinates, type CropCycle, type FarmData, type Field, type Snapshot } from "@/lib/domain/farm";
import { CalendarPanel } from "@/features/calendar/calendar-panel";
import { PlanningPanel } from "@/features/recommendations/planning-panel";
import { reschedulePreview, rescheduleTasks } from "@/lib/domain/calendar";
import { checkBackup, recordCounts } from "@/lib/domain/backup-check";
import { TodayPanel } from "@/features/weather/today-panel";
import { loadFarm, saveFarm } from "@/lib/storage/farm-store";

const blankField = { farmName: "My farm", name: "", region: "", area: "", unit: "ha" as "ha" | "acre" | "m2", water: "unknown" as Field["water"] };
const blankCycle = { crop: "", variety: "", sowing: "", stage: "" as "" | NonNullable<CropCycle["stage"]>, season: "", status: "planned" as CropCycle["status"] };

export function FarmWorkspace({ todayOnly = false, planOnly = false }: { todayOnly?: boolean; planOnly?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null), [selected, setSelected] = useState("");
  const [draft, setDraft] = useState(blankField), [cycleDraft, setCycleDraft] = useState(blankCycle), [editingCycle, setEditingCycle] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Coordinates | null>(null), [confirmed, setConfirmed] = useState(false), [remember, setRemember] = useState(false);
  const [latitude, setLatitude] = useState(""), [longitude, setLongitude] = useState(""), [locating, setLocating] = useState(false);
  const [sessionLocations, setSessionLocations] = useState<Record<string, Coordinates>>({});
  const [includeCoordinates, setIncludeCoordinates] = useState(false), [incoming, setIncoming] = useState<Backup | null>(null);
  const [resolution, setResolution] = useState<"device" | "backup" | "">("");
  const [planCycle,setPlanCycle] = useState("");
  const [cycleChange,setCycleChange] = useState<CropCycle | null>(null);
  const [dateChoice,setDateChoice] = useState<"shift" | "keep" | "">("");
  const [stageConfirmed,setStageConfirmed] = useState(false);
  const [deletion, setDeletion] = useState<"all" | { field: string } | { cycle: string } | null>(null);
  const [prepared,setPrepared]=useState<{url:string;revision:number;coordinates:boolean}|null>(null);
  const [backupCheck,setBackupCheck]=useState<ReturnType<typeof checkBackup>|null>(null),[checkError,setCheckError]=useState('');
  const checkRef=useRef<HTMLInputElement>(null),checking=useRef(0);
  useEffect(()=>()=>{if(prepared)URL.revokeObjectURL(prepared.url);},[prepared]);
  const importRef = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLElement>(null);
  const changeRef = useRef<HTMLElement>(null);
  const operation = useRef(false), locationRequest = useRef(0);

  useEffect(() => {
    let mounted = true;
    const requests = locationRequest;
    loadFarm().then(data => { if (mounted) setSnapshot(data); }).catch(e => { if (mounted) setError(errorText(e)); });
    return () => { mounted = false; requests.current++; };
  }, []);

  useEffect(() => { if (deletion) deleteRef.current?.focus(); }, [deletion]);

  useEffect(() => { if (cycleChange) changeRef.current?.focus(); }, [cycleChange]);

  const activeField = snapshot?.fields.find(f => f.id === selected);
  const cycles = snapshot?.cycles.filter(c => c.field_id === selected) ?? [];
  let preview: ReturnType<typeof planImport> | null = null;
  let previewError = "";
  if (snapshot && incoming) {
    try { preview = planImport(snapshot, incoming.data, resolution || undefined); } catch (e) { previewError = errorText(e); }
  }

  async function persist(data: FarmData, success: string): Promise<boolean> {
    if (!snapshot || operation.current) return false;
    operation.current = true; setBusy(true); setError(""); setMessage("");
    try { const saved = await saveFarm(data, snapshot.revision); setSnapshot(saved); setMessage(success); return true; }
    catch (e) { setError(errorText(e)); return false; }
    finally { operation.current = false; setBusy(false); }
  }
  function resetField() {
    locationRequest.current++; setLocating(false); setEditing(null); setDraft(blankField); setCandidate(null); setConfirmed(false); setRemember(false); setLatitude(""); setLongitude("");
  }
  function editField(field: Field) {
    resetField(); setEditing(field.id); setSelected(field.id); setEditingCycle(null); setCycleDraft(blankCycle);
    const farm = snapshot!.farms.find(f => f.id === field.farm_id)!;
    setDraft({ farmName: farm.name, name: field.name, region: field.region ?? "", area: field.area ? String(field.area.value) : "", unit: field.area?.unit ?? "ha", water: field.water });
    const location = field.location ?? sessionLocations[field.id] ?? null;
    setCandidate(location); setConfirmed(!!location); setRemember(!!field.location);
    if (location) { setLatitude(String(location.latitude)); setLongitude(String(location.longitude)); }
  }
  function requestLocation() {
    setError(""); setLocating(true); setCandidate(null); setConfirmed(false);
    const request = ++locationRequest.current;
    if (!navigator.geolocation) { setLocating(false); setError("GPS is unavailable. Enter a region or coordinates, or skip location."); return; }
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return;
      setLocating(false);
      const location: Coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_m: position.coords.accuracy, method: "gps", confirmed_at: new Date().toISOString() };
      setCandidate(location); setLatitude(String(location.latitude)); setLongitude(String(location.longitude));
    }, failure => {
      if (request !== locationRequest.current) return;
      setLocating(false); setError(failure.code === 1 ? "Location permission was denied. You can enter your region manually or skip location." : "Could not get a GPS fix. Enter coordinates manually or skip location.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }
  function useManualLocation() {
    try {
      if (!latitude.trim() || !longitude.trim()) throw new Error("Enter both latitude and longitude, or skip location.");
      const location = validateCoordinates({ latitude: Number(latitude), longitude: Number(longitude), accuracy_m: null, method: "manual", confirmed_at: new Date().toISOString() });
      locationRequest.current++; setLocating(false); setCandidate(location); setConfirmed(false); setError("");
    } catch (e) { setError(errorText(e)); }
  }
  async function submitField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!snapshot) return;
    try {
      if (candidate && !confirmed) throw new Error("Confirm that these coordinates represent your field, or choose Skip location.");
      const now = new Date().toISOString(), previous = snapshot.fields.find(f => f.id === editing);
      const farm = previous ? snapshot.farms.find(f => f.id === previous.farm_id)! : { ...newMeta(now), name: draft.farmName.trim(), language: "en" as const, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" };
      const updatedFarm = { ...farm, name: draft.farmName.trim(), updated_at: now };
      const field: Field = { ...(previous ?? newMeta(now)), updated_at: now, farm_id: farm.id, name: draft.name.trim(), region: draft.region.trim() || null, area: draft.area.trim() ? { value: Number(draft.area), unit: draft.unit } : null, water: draft.water, location: remember && candidate && confirmed ? { ...candidate, confirmed_at: now } : null };
      const data = validateData({ ...snapshot, farms: [...snapshot.farms.filter(f => f.id !== farm.id), updatedFarm], fields: [...snapshot.fields.filter(f => f.id !== field.id), field] });
      if (await persist(data, "Field saved on this device.")) {
        setSessionLocations(old => { const next = { ...old }; if (candidate && confirmed) next[field.id] = candidate; else delete next[field.id]; return next; });
        setSelected(field.id); resetField();
      }
    } catch (e) { setError(errorText(e)); }
  }
  async function submitCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!snapshot || !activeField) return;
    try {
      const now = new Date().toISOString(), previous = snapshot.cycles.find(c => c.id === editingCycle);
      const cycle: CropCycle = { ...(previous ?? newMeta(now)), updated_at: now, field_id: activeField.id, crop: cycleDraft.crop.trim(), variety: cycleDraft.variety.trim() || null, sowing_date: cycleDraft.sowing || null, stage: cycleDraft.stage || null, stage_recorded_at: cycleDraft.stage ? now : null, season: cycleDraft.season.trim() || null, status: cycleDraft.status };
      const data = validateData({ ...snapshot, cycles: [...snapshot.cycles.filter(c => c.id !== cycle.id), cycle] });
      if (previous && (previous.sowing_date !== cycle.sowing_date || previous.stage !== cycle.stage) && snapshot.tasks.some(t => t.cycle_id === cycle.id)) { setCycleChange(cycle); setDateChoice(""); setStageConfirmed(false); return; }
      if (await persist(data, "Crop cycle saved.")) { setCycleDraft(blankCycle); setEditingCycle(null); }
    } catch (e) { setError(errorText(e)); }
  }
  async function applyCycleChange() {
    if (!snapshot || !cycleChange || (reschedulePreview(snapshot.tasks,cycleChange).length && !dateChoice) || !stageConfirmed) return;
    const tasks = rescheduleTasks(snapshot.tasks,cycleChange,dateChoice || "keep",new Date().toISOString());
    if (await persist({...snapshot,tasks,cycles:snapshot.cycles.map(c=>c.id===cycleChange.id ? cycleChange : c)},"Cycle and confirmed reminder plan saved.")) { setCycleChange(null); setEditingCycle(null); setCycleDraft(blankCycle); }
  }
  async function forgetLocation(field: Field) {
    if (!snapshot) return;
    if (await persist({ ...snapshot, fields: snapshot.fields.map(f => f.id === field.id ? { ...f, location: null, updated_at: new Date().toISOString() } : f) }, "Field coordinates removed from this device and this session.")) {
      setSessionLocations(old => { const next = { ...old }; delete next[field.id]; return next; });
      if (editing === field.id) { locationRequest.current++; setLocating(false); setCandidate(null); setConfirmed(false); setRemember(false); setLatitude(""); setLongitude(""); }
    }
  }
  async function confirmDelete() {
    if (!snapshot || !deletion) return;
    const data = deletion === "all" ? emptyData() : "field" in deletion ? removeField(snapshot, deletion.field) : removeCycle(snapshot, deletion.cycle);
    if (await persist(data, "Selected records deleted from this device.")) {
      if (deletion === "all") { setSessionLocations({}); setSelected(""); }
      else if ("field" in deletion) { const id = deletion.field; setSessionLocations(old => { const next = { ...old }; delete next[id]; return next; }); if (selected === id) setSelected(""); }
      resetField(); setCycleDraft(blankCycle); setEditingCycle(null); setIncoming(null); setDeletion(null);
    }
  }
  function downloadBackup() {
    if (!snapshot) return;
    try {
      const url=URL.createObjectURL(new Blob([JSON.stringify(makeBackup(snapshot,includeCoordinates),null,2)],{type:'application/json'}));
      setPrepared({url,revision:snapshot.revision,coordinates:includeCoordinates});
      setMessage('Backup prepared. Download it using the link below, then check the saved file before relying on it.');
    } catch(e){setError(errorText(e));}
  }
  async function inspectFile(file?:File){
    const request=++checking.current;setBackupCheck(null);setCheckError('');if(!file)return;
    try{if(file.size>2*1024*1024)throw new Error('Backup must be smaller than 2 MB.');const checked=checkBackup(await file.text());if(request===checking.current)setBackupCheck(checked);}
    catch(e){if(request===checking.current)setCheckError(errorText(e));}
  }
  async function readImport(file?: File) {
    setError(""); setIncoming(null); setResolution(""); if (!file) return;
    try { if (file.size > 2 * 1024 * 1024) throw new Error("Backup must be smaller than 2 MB."); setIncoming(parseBackup(await file.text())); }
    catch (e) { setError(errorText(e)); }
  }
  async function applyImport() {
    if (!preview || (preview.conflicts.length && !resolution)) return;
    if (await persist(preview.merged, "Backup imported. Existing unrelated records were kept.")) { setIncoming(null); setResolution(""); resetField(); setCycleDraft(blankCycle); setEditingCycle(null); setSelected(""); setSessionLocations({}); setCycleChange(null); }
  }

  return (
    <div className="farm-workspace">
      <section className="farm-heading">
        <div><p className="eyebrow">Your farm, on your device</p><h1>{planOnly ? "Plan your season." : todayOnly ? "Your field, today." : "Start with your field."}</h1><p className="lede">Add a field and crop cycle. Keep a useful record of where your season begins—no account needed.</p></div>
        <div className="farm-summary"><strong>{snapshot?.fields.length ?? "—"}</strong><span>fields saved</span><strong>{snapshot?.cycles.length ?? "—"}</strong><span>crop cycles</span></div>
      </section>
      <p className="device-note">Records stay in this browser. Clearing browser data can remove them, so export a backup. Select a field to see weather and missing-information prompts. Agricultural guidance requires a reviewed catalog.</p>
      <div aria-live="polite">{message && <p className="success-note">{message}</p>}</div>
      {error && <div className="form-error" role="alert"><p>{error}</p><button type="button" className="text-button" onClick={() => window.location.reload()}>Reload saved records</button></div>}
      {!snapshot && <p role="status">{error ? "Device storage is not ready. Saving is disabled." : "Loading your device records…"}</p>}
      {(todayOnly || planOnly) && <label>Field<select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a field</option>{snapshot?.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
      {activeField && !planOnly && <TodayPanel key={`${activeField.id}:${activeField.updated_at}:${(sessionLocations[activeField.id] ?? activeField.location)?.confirmed_at ?? "none"}`} field={activeField} snapshot={snapshot!} recordBusy={busy} save={persist} cycles={cycles} tasks={snapshot!.tasks} soilTests={snapshot!.soil_tests} timezone={snapshot!.farms.find(f=>f.id===activeField.farm_id)!.timezone} location={sessionLocations[activeField.id] ?? activeField.location} />}
      {(todayOnly || planOnly) && !activeField && <p className="device-note">Choose a saved field above. Add or edit fields and crop cycles in <a href="/farm">My Farm</a>. Session-only coordinates stay on the page where you entered them.</p>}
      {planOnly && activeField && <><label>Planning crop cycle<select value={planCycle} onChange={e=>setPlanCycle(e.target.value)}><option value="">Choose a cycle</option>{cycles.map(c=><option key={c.id} value={c.id}>{c.crop} · {c.status}</option>)}</select></label><PlanningPanel snapshot={snapshot!} fieldId={activeField.id} cycleId={planCycle || null} />{cycles.find(c=>c.id===planCycle) && <CalendarPanel key={planCycle} snapshot={snapshot!} cycle={cycles.find(c=>c.id===planCycle)!} timezone={snapshot!.farms.find(f=>f.id===activeField.farm_id)!.timezone} busy={busy} save={persist} />}</>}
      {!todayOnly && !planOnly && <><div className="farm-grid">
        <section className="farm-card" aria-labelledby="field-title">
          <div className="card-heading"><h2 id="field-title">{editing ? "Edit field" : "Add a field"}</h2>{editing && <button type="button" className="text-button" onClick={resetField}>Cancel edit</button>}</div>
          <form onSubmit={submitField}>
            <fieldset disabled={!snapshot || busy}><legend className="visually-hidden">Field details</legend>
              <label>Farm name<input required maxLength={120} value={draft.farmName} onChange={e => setDraft({ ...draft, farmName: e.target.value })} /></label>
              <label>Field name<input required maxLength={120} placeholder="For example, North field" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
              <label>Region / district <span>(optional)</span><input maxLength={120} placeholder="Enter the field’s region" value={draft.region} onChange={e => setDraft({ ...draft, region: e.target.value })} /></label>
              <div className="input-pair"><label>Field area <span>(optional)</span><input type="number" min="0.000001" step="any" value={draft.area} onChange={e => setDraft({ ...draft, area: e.target.value })} /></label><label>Unit<select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value as typeof draft.unit })}><option value="ha">Hectares</option><option value="acre">Acres</option><option value="m2">Square metres</option></select></label></div>
              <label>Water access<select value={draft.water} onChange={e => setDraft({ ...draft, water: e.target.value as Field["water"] })}>{WATER_OPTIONS.map(v => <option key={v} value={v}>{v === "unknown" ? "I’m not sure yet" : v.charAt(0).toUpperCase() + v.slice(1)}</option>)}</select></label>
              <div className="location-box"><h3>Field location <span>Optional</span></h3><p>Use GPS only if you are at the field. Coordinates stay in memory unless you choose to save them. Fetching weather requires a separate consent click that sends them to Open-Meteo.</p>
                <div className="button-row"><button type="button" className="button button-secondary" disabled={locating} onClick={requestLocation}>{locating ? "Finding your location…" : "Use my GPS location"}</button><button type="button" className="text-button" onClick={() => { locationRequest.current++; setLocating(false); setCandidate(null); setConfirmed(false); setRemember(false); setLatitude(""); setLongitude(""); }}>Skip location</button></div>
                <details><summary>Enter coordinates manually</summary><div className="input-pair"><label>Latitude<input type="number" step="any" min="-90" max="90" value={latitude} onChange={e => { setLatitude(e.target.value); setConfirmed(false); setCandidate(null); }} /></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={longitude} onChange={e => { setLongitude(e.target.value); setConfirmed(false); setCandidate(null); }} /></label></div><button type="button" className="button button-secondary" onClick={useManualLocation}>Use these coordinates</button></details>
                {candidate && <div className="coordinate-preview"><p>{candidate.latitude.toFixed(5)}, {candidate.longitude.toFixed(5)}{candidate.accuracy_m !== null && ` · accuracy ±${Math.round(candidate.accuracy_m)} m`}</p><label className="check-label"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />These coordinates represent my field.</label><label className="check-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Remember this field location on this device.</label></div>}
              </div>
              <button type="submit" className="button button-primary button-wide">{busy ? "Saving…" : editing ? "Save field changes" : "Save field"}</button>
            </fieldset>
          </form>
        </section>
        <section className="farm-card" aria-labelledby="saved-title"><h2 id="saved-title">Your fields</h2>
          {!snapshot?.fields.length && <div className="empty-state"><span aria-hidden="true">↗</span><h3>A place for your season.</h3><p>Add your first field. You can leave the area, location and unknown details blank.</p></div>}
          <div className="field-list">{snapshot?.fields.map(field => <article className={selected === field.id ? "field-item selected" : "field-item"} key={field.id}>
            <h3>{field.name}</h3><p>{snapshot.farms.find(f => f.id === field.farm_id)?.name} · {field.region ?? "Region not entered"}</p><p>{field.area ? `${field.area.value} ${field.area.unit}` : "Area not entered"} · {field.water === "unknown" ? "Water access unknown" : field.water}</p><p className="field-location-state">{field.location ? "Coordinates saved on this device" : sessionLocations[field.id] ? "Coordinates available for this session only" : "No coordinates saved"}</p>
            <div className="button-row"><button type="button" className="button button-secondary" onClick={() => { setSelected(field.id); setCycleDraft(blankCycle); setEditingCycle(null); requestAnimationFrame(() => document.getElementById("cycles-title")?.focus()); }}>Open field overview</button><button type="button" className="text-button" onClick={() => editField(field)}>Edit</button><button disabled={busy} type="button" className="text-button" onClick={() => setDeletion({ field: field.id })}>Delete</button></div>
            {(field.location || sessionLocations[field.id]) && <button type="button" disabled={busy} className="text-button" onClick={() => void forgetLocation(field)}>Remove field coordinates</button>}
          </article>)}</div>
        </section>
      </div>
      {activeField && <section className="farm-card cycle-section" aria-labelledby="cycles-title"><p className="eyebrow">{activeField.name}</p><h2 id="cycles-title" tabIndex={-1}>Your crop cycles</h2><p>Use the crop and stage you know. These records do not establish seed suitability or generate farming advice yet.</p>
        <div className="farm-grid"><form onSubmit={submitCycle}><fieldset disabled={busy}><legend>{editingCycle ? "Edit crop cycle" : "Start a crop cycle"}</legend>
          <label>Crop<input required maxLength={120} placeholder="Enter your crop" value={cycleDraft.crop} onChange={e => setCycleDraft({ ...cycleDraft, crop: e.target.value })} /></label>
          <label>Variety <span>(optional)</span><input maxLength={120} value={cycleDraft.variety} onChange={e => setCycleDraft({ ...cycleDraft, variety: e.target.value })} /></label>
          <div className="input-pair"><label>Sowing date <span>(optional)</span><input type="date" value={cycleDraft.sowing} onChange={e => setCycleDraft({ ...cycleDraft, sowing: e.target.value })} /></label><label>Status<select value={cycleDraft.status} onChange={e => setCycleDraft({ ...cycleDraft, status: e.target.value as CropCycle["status"] })}>{CYCLE_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}</select></label></div>
          <label>Current growth stage<select value={cycleDraft.stage} onChange={e => setCycleDraft({ ...cycleDraft, stage: e.target.value as typeof cycleDraft.stage })}><option value="">Not known / not planted</option>{STAGES.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
          <label>Season <span>(optional)</span><input maxLength={120} placeholder="Enter your intended season" value={cycleDraft.season} onChange={e => setCycleDraft({ ...cycleDraft, season: e.target.value })} /></label>
          <div className="button-row"><button type="submit" className="button button-primary">{editingCycle ? "Save cycle changes" : "Save crop cycle"}</button>{editingCycle && <button type="button" className="text-button" onClick={() => { setEditingCycle(null); setCycleDraft(blankCycle); }}>Cancel edit</button>}</div>
        </fieldset></form>
        <div>{!cycles.length && <p className="empty-state">No crop cycles yet. Start with the crop you plan to grow.</p>}{cycles.map(cycle => <article key={cycle.id} className="field-item"><span className="cycle-badge">{cycle.status}</span><h3>{cycle.crop}{cycle.variety ? ` · ${cycle.variety}` : ""}</h3><p>{cycle.sowing_date ? `Sowing: ${cycle.sowing_date}` : "Sowing date not entered"}</p><p>{cycle.stage ?? "Stage unknown"} · {cycle.season ?? "Season unknown"}</p><div className="button-row"><button type="button" className="text-button" onClick={() => { setEditingCycle(cycle.id); setCycleDraft({ crop: cycle.crop, variety: cycle.variety ?? "", sowing: cycle.sowing_date ?? "", stage: cycle.stage ?? "", season: cycle.season ?? "", status: cycle.status }); }}>Edit cycle</button><button disabled={busy} type="button" className="text-button" onClick={() => setDeletion({ cycle: cycle.id })}>Delete cycle</button></div></article>)}</div></div>
      </section>}
      {activeField && cycles.map(cycle=><CalendarPanel key={cycle.id} snapshot={snapshot!} cycle={cycle} timezone={snapshot!.farms.find(f=>f.id===activeField.farm_id)!.timezone} busy={busy} save={persist} />)}
      <section className="farm-card backup-section" aria-labelledby="backup-title"><h2 id="backup-title">Keep a copy of your records</h2><p>Export a JSON backup before clearing browser data or changing devices. Import is validated and previewed before anything is saved.</p>
        <label className="check-label"><input type="checkbox" checked={includeCoordinates} onChange={e => setIncludeCoordinates(e.target.checked)} />Include saved precise coordinates in my backup.</label>
        <div className="button-row"><button type="button" disabled={!snapshot || busy} className="button button-primary" onClick={downloadBackup}>Export backup</button><button type="button" disabled={!snapshot || busy} className="button button-secondary" onClick={() => importRef.current?.click()}>Import backup</button><button type="button" disabled={busy} className="button button-secondary" onClick={()=>checkRef.current?.click()}>Check backup file</button><button type="button" disabled={!snapshot || busy} className="text-button" onClick={() => setDeletion("all")}>Delete all farm records</button></div>
        <input ref={importRef} type="file" className="visually-hidden" accept="application/json,.json" onChange={e => { void readImport(e.target.files?.[0]); e.target.value = ""; }} />
        {prepared && (prepared.revision===snapshot?.revision && prepared.coordinates===includeCoordinates ? <p className="success-note"><a href={prepared.url} download="agrirakshak-farm-backup.json">Download prepared farm backup</a> · {prepared.coordinates ? 'Includes saved precise coordinates' : 'Excludes precise field coordinates'}. This link prepares a file; only checking your saved file confirms it is readable.</p> : <p>Records or the coordinate choice changed. Prepare a fresh backup before downloading.</p>)}
        <input ref={checkRef} type="file" className="visually-hidden" accept="application/json,.json" onChange={e=>{void inspectFile(e.target.files?.[0]);e.target.value='';}} />
        {checkError && <p className="form-error" role="alert">Backup check failed: {checkError} No records were changed.</p>}
        {backupCheck && <section className="success-note" aria-label="Backup file check"><h3>Valid, compatible backup file</h3><p>All supported record types, dates, references, units and privacy flags passed validation. No records were changed.</p><p>{Object.entries(backupCheck.counts).map(([label,count])=>`${count} ${label.replaceAll('_',' ')}`).join(' · ')}</p><p>Exported {backupCheck.backup.exported_at}. {backupCheck.backup.includes_coordinates ? 'This file includes saved precise field coordinates.' : 'This file excludes precise field coordinates.'} Use Import backup for the restore preview and explicit conflict choices. The check confirms readability, not that every farm event was entered.</p>{snapshot && <p>Current device: {Object.entries(recordCounts(snapshot)).map(([label,count])=>`${count} ${label.replaceAll('_',' ')}`).join(' · ')}</p>}</section>}
        {incoming && <div className="import-preview"><h3>Review this backup</h3><p>{incoming.data.fields.length} fields · {incoming.data.cycles.length} crop cycles · {incoming.data.tasks.length} reminders · {incoming.data.scans.length} screening summaries · {incoming.data.soil_tests.length} soil tests · {incoming.data.expenses.length} expense entries · {incoming.data.harvests.length} harvest entries · {incoming.data.sales.length} sales · {incoming.data.observations.length} observations · {incoming.data.feedback.length} step responses · {preview?.additions ?? 0} new records</p>{incoming.includes_coordinates && <p>This backup includes saved precise field coordinates. Importing it will store them on this device.</p>}{previewError && <p role="alert">{previewError}</p>}
          {!!preview?.conflicts.length && <fieldset><legend>{preview.conflicts.length} changed records need a choice</legend><p>Conflicting records: {preview.conflicts.map(c => c.label).join(", ")}. Choose which version to keep for all conflicts; unrelated records remain.</p><label className="check-label"><input type="radio" name="conflict" checked={resolution === "device"} onChange={() => setResolution("device")} />Keep device versions</label><label className="check-label"><input type="radio" name="conflict" checked={resolution === "backup"} onChange={() => setResolution("backup")} />Use backup versions</label></fieldset>}
          <div className="button-row"><button type="button" className="button button-primary" disabled={busy || !preview || (!!preview.conflicts.length && !resolution)} onClick={() => void applyImport()}>Confirm import</button><button className="text-button" type="button" onClick={() => setIncoming(null)}>Cancel import</button></div>
        </div>}
      </section>
      </>}
      {cycleChange && snapshot && <section ref={changeRef} tabIndex={-1} className="import-preview farm-card" role="region" aria-label="Review cycle changes"><h2>Review cycle changes</h2><p>Sowing date: {snapshot.cycles.find(c=>c.id===cycleChange.id)?.sowing_date ?? "unknown"} → {cycleChange.sowing_date ?? "unknown"}. Stage: {snapshot.cycles.find(c=>c.id===cycleChange.id)?.stage ?? "unknown"} → {cycleChange.stage ?? "unknown"}. Completed reminders stay unchanged.</p>{reschedulePreview(snapshot.tasks,cycleChange).map(p=><p key={p.id}>{p.title}: {p.before ?? "unscheduled"} → {p.after ?? "unscheduled"}</p>)}{!!reschedulePreview(snapshot.tasks,cycleChange).length && <fieldset><legend>Pending sowing reminders</legend><label className="check-label"><input type="radio" name="reschedule" checked={dateChoice === "shift"} onChange={()=>setDateChoice("shift")} />Move them to the new sowing date</label><label className="check-label"><input type="radio" name="reschedule" checked={dateChoice === "keep"} onChange={()=>setDateChoice("keep")} />Keep their existing dates / anchors</label></fieldset>}<label className="check-label"><input type="checkbox" checked={stageConfirmed} onChange={e=>setStageConfirmed(e.target.checked)} />I confirm the cycle details and that stage reminders use my recorded stage.</label><div className="button-row"><button className="button button-primary" type="button" disabled={busy || !stageConfirmed || (!!reschedulePreview(snapshot.tasks,cycleChange).length && !dateChoice)} onClick={()=>void applyCycleChange()}>Confirm cycle and schedule</button><button className="text-button" type="button" onClick={()=>setCycleChange(null)}>Cancel cycle changes</button></div></section>}
      {deletion && <section ref={deleteRef} tabIndex={-1} className="delete-confirm" role="alert" aria-labelledby="delete-title"><h2 id="delete-title">Confirm deletion</h2><p>{deletion === "all" ? `Delete all ${snapshot?.fields.length ?? 0} fields, ${snapshot?.cycles.length ?? 0} crop cycles and ${snapshot?.tasks.length ?? 0} reminders and ${snapshot?.scans.length ?? 0} screening summaries and ${snapshot?.soil_tests.length ?? 0} soil tests, ${snapshot?.expenses.length ?? 0} expense entries and ${snapshot?.harvests.length ?? 0} harvest entries and ${snapshot?.sales.length ?? 0} sales and ${snapshot?.observations.length ?? 0} observations and ${snapshot?.feedback.length ?? 0} step responses from this device? Export a backup first if you want to keep them.` : "field" in deletion ? `Delete this field and its ${snapshot?.cycles.filter(c => c.field_id === deletion.field).length ?? 0} crop cycles and ${snapshot?.soil_tests.filter(s => s.field_id === deletion.field).length ?? 0} soil tests?` : `Delete this crop cycle and its ${snapshot?.expenses.filter(e => e.cycle_id === deletion.cycle).length ?? 0} expense entries and ${snapshot?.harvests.filter(h => h.cycle_id === deletion.cycle).length ?? 0} harvest entries and ${snapshot?.sales.filter(s => s.cycle_id === deletion.cycle).length ?? 0} sales and ${snapshot?.observations.filter(o => o.cycle_id === deletion.cycle).length ?? 0} observations and ${snapshot?.feedback.filter(f => f.cycle_id === deletion.cycle).length ?? 0} step responses?`} Associated reminders, screening summaries, expenses, harvest records, sales, observations and associated step feedback will also be deleted. Soil tests belong to a field: deleting a cycle keeps them; deleting a field removes them. This cannot be undone without a backup.</p><div className="button-row"><button type="button" disabled={busy} className="button button-danger" onClick={() => void confirmDelete()}>Delete selected records</button><button type="button" className="button button-secondary" onClick={() => setDeletion(null)}>Keep records</button></div></section>}
    </div>
  );
}
function errorText(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Your saved records were not changed."; }

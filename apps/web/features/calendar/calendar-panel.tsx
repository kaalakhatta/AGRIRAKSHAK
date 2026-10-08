"use client";
import { useState, type FormEvent } from "react";
import { newMeta, STAGES, todayInZone, type CropCycle, type FarmData, type Snapshot } from "@/lib/domain/farm";
import { dueDate, taskTiming, validateTask, type Schedule, type CalendarTask } from "@/lib/domain/calendar";
export function CalendarPanel({ snapshot, cycle, timezone, busy, save }: { snapshot: Snapshot; cycle: CropCycle; timezone: string; busy: boolean; save: (data: FarmData, message: string) => Promise<boolean> }) {
  const [title,setTitle] = useState(""), [kind,setKind] = useState<Schedule["kind"]>("date"), [date,setDate] = useState(""), [offset,setOffset] = useState("0"), [stage,setStage] = useState<NonNullable<CropCycle["stage"]>>("establishment");
  const [editing,setEditing] = useState<string | null>(null), [error,setError] = useState(""), [remove,setRemove] = useState<string | null>(null);
  const tasks = snapshot.tasks.filter(t => t.cycle_id === cycle.id);
  const field = snapshot.fields.find(field => field.id === cycle.field_id);
  const demo = cycle.origin === "demo" || field?.origin === "demo" || snapshot.farms.find(farm=>farm.id === field?.farm_id)?.origin === "demo";
  const today = todayInZone(timezone);
  function reset() { setTitle(""); setDate(""); setOffset("0"); setKind("date"); setEditing(null); setError(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try {
      const previous = tasks.find(t => t.id === editing), now = new Date().toISOString();
      const schedule: Schedule = kind === "date" ? {kind,date} : kind === "stage" ? {kind,stage} : {kind,offset_days: offset.trim() ? Number(offset) : NaN,anchor_date:cycle.sowing_date};
      const task = validateTask({ ...(previous ?? newMeta(now)), updated_at:now, cycle_id:cycle.id, title:title.trim(), schedule, status:previous?.status ?? "pending", completed_at:previous?.completed_at ?? null });
      if (await save({...snapshot,tasks:[...snapshot.tasks.filter(t => t.id !== task.id),task]},"Your reminder was saved on this device.")) reset();
    } catch(e) { setError(e instanceof Error ? e.message : "Reminder could not be saved."); }
  }
  async function toggle(task: CalendarTask) {
    const now = new Date().toISOString(), done = task.status !== "done";
    await save({...snapshot,tasks:snapshot.tasks.map(t => t.id === task.id ? {...t,status:done ? "done" : "pending", completed_at:done ? now : null, updated_at:now} : t)},done ? "Reminder marked complete." : "Reminder reopened.");
  }
  function edit(task: CalendarTask) {
    setEditing(task.id); setTitle(task.title); setKind(task.schedule.kind); setError("");
    if (task.schedule.kind === "date") setDate(task.schedule.date);
    if (task.schedule.kind === "sowing") setOffset(String(task.schedule.offset_days));
    if (task.schedule.kind === "stage") setStage(task.schedule.stage);
    document.getElementById(`${cycle.id}-reminder-title`)?.focus();
  }
  return <section className="farm-card calendar-section" aria-labelledby={`${cycle.id}-calendar-title`}><p className="eyebrow">{cycle.crop} · your schedule</p><h2 id={`${cycle.id}-calendar-title`}>Season reminders</h2><p>You choose the task and timing. These reminders are personal plans, not reviewed agricultural recommendations. Dates use {timezone}; today is {today}. No notifications are sent.</p>
    {demo && <p className="simulation-label">Synthetic exhibition cycle · these reminders are demonstration records</p>}
    <div className="farm-grid"><form onSubmit={submit}><fieldset disabled={busy}><legend>{editing ? "Edit your reminder" : "Add your reminder"}</legend><label>Reminder title<input id={`${cycle.id}-reminder-title`} required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="For example, update my field notes" /></label><label>Timing<select value={kind} onChange={e=>setKind(e.target.value as Schedule["kind"])}><option value="date">On a date I choose</option><option value="sowing">Days from my sowing date</option><option value="stage">At a stage I confirm</option></select></label>
    {kind === "date" && <label>Reminder date<input type="date" required value={date} onChange={e=>setDate(e.target.value)} /></label>}
    {kind === "sowing" && <><label>Days after sowing<input type="number" required min={-3650} max={3650} step={1} value={offset} onChange={e=>setOffset(e.target.value)} /></label><p>Negative days mean before sowing. {cycle.sowing_date ? `Anchor: ${cycle.sowing_date}.` : "Sowing date is unknown; this reminder stays unscheduled."}</p></>}
    {kind === "stage" && <><label>Confirmed stage<select value={stage} onChange={e=>setStage(e.target.value as typeof stage)}>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select></label><p>Ready only when your recorded stage matches. No growth stage is inferred from days or weather.</p></>}
    {error && <p role="alert" className="form-error">{error}</p>}<div className="button-row"><button className="button button-primary" type="submit">Save reminder</button>{editing && <button className="text-button" type="button" onClick={reset}>Cancel edit</button>}</div></fieldset></form>
    <div>{!tasks.length && <p className="empty-state">No reminders yet. Add a task you want to keep track of.</p>}{[...tasks].sort((a,b)=>(dueDate(a) ?? "9999").localeCompare(dueDate(b) ?? "9999") || a.id.localeCompare(b.id)).map(task=><article className="field-item" key={task.id}><span className="cycle-badge">{taskTiming(task,cycle,today)}</span><h3>{task.title}</h3><p>{dueDate(task) ?? "No calendar date"} · Your own reminder</p>{task.schedule.kind === "sowing" && <p>{task.schedule.offset_days} days from {task.schedule.anchor_date ?? "unknown sowing date"}</p>}{task.completed_at && <p>Completed {new Date(task.completed_at).toLocaleString("en",{timeZone:timezone})}</p>}<div className="button-row"><button disabled={busy} className="button button-secondary" type="button" onClick={()=>void toggle(task)}>{task.status === "done" ? "Reopen" : "Mark done"}</button><button disabled={busy} className="text-button" type="button" onClick={()=>edit(task)}>Edit reminder</button><button disabled={busy} className="text-button" type="button" onClick={()=>setRemove(task.id)}>Delete reminder</button></div></article>)}</div></div>
    {remove && <div className="delete-confirm" role="alert"><h3>Delete this reminder?</h3><p>{tasks.find(t=>t.id===remove)?.title}. This cannot be undone without a backup.</p><div className="button-row"><button disabled={busy} className="button button-danger" type="button" onClick={async()=>{if(await save({...snapshot,tasks:snapshot.tasks.filter(t=>t.id!==remove)},"Reminder deleted.")){setRemove(null);if(editing===remove)reset();}}}>Confirm reminder deletion</button><button className="text-button" type="button" onClick={()=>setRemove(null)}>Keep reminder</button></div></div>}
  </section>;
}

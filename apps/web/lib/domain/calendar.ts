import { STAGES, validateDate, type CropCycle, type Meta } from "./farm.ts";
export type Schedule = { kind: "date"; date: string } | { kind: "sowing"; offset_days: number; anchor_date: string | null } | { kind: "stage"; stage: NonNullable<CropCycle["stage"]> };
export type CalendarTask = Meta & { cycle_id: string; title: string; schedule: Schedule; status: "pending" | "done"; completed_at: string | null };
export function addDays(date: string, days: number): string {
  validateDate(date);
  if (!Number.isSafeInteger(days) || Math.abs(days) > 3650) throw new Error("Reminder offset must be a whole number within ten years.");
  const result = new Date(Date.parse(date) + days * 86400000).toISOString().slice(0,10);
  validateDate(result);
  return result;
}
export function dueDate(task: CalendarTask): string | null {
  return task.schedule.kind === "date" ? task.schedule.date : task.schedule.kind === "sowing" && task.schedule.anchor_date ? addDays(task.schedule.anchor_date,task.schedule.offset_days) : null;
}
export function taskTiming(task: CalendarTask, cycle: CropCycle, today: string): string {
  if (task.status === "done") return "Completed";
  if (task.schedule.kind === "stage") return cycle.stage === task.schedule.stage ? "Ready at your confirmed stage" : `Waiting for confirmed ${task.schedule.stage} stage`;
  const due = dueDate(task);
  return !due ? "Waiting for sowing date" : due < today ? "Overdue" : due === today ? "Due today" : "Upcoming";
}
export function validateTask(value: unknown): CalendarTask {
  const fail = (): never => { throw new Error("Invalid calendar reminder. No records were changed."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const t = value as CalendarTask;
  if (t.schema_version !== 1 || typeof t.id !== "string" || !t.id.trim() || t.id.length > 120 || typeof t.cycle_id !== "string" || !t.cycle_id.trim() || t.cycle_id.length > 120 || typeof t.title !== "string" || !t.title.trim() || t.title.length > 120 || !["user","demo","import"].includes(t.origin) || !["pending","done"].includes(t.status)) return fail();
  const timestamp = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,19) === s.slice(0,19);
  if (!timestamp(t.created_at) || !timestamp(t.updated_at) || Date.parse(t.updated_at) < Date.parse(t.created_at) || (t.status === "done" ? !timestamp(t.completed_at) || Date.parse(t.completed_at) < Date.parse(t.created_at) || Date.parse(t.completed_at) > Date.parse(t.updated_at) : t.completed_at !== null)) return fail();
  if (!t.schedule || typeof t.schedule !== "object") return fail();
  let schedule: Schedule;
  if (t.schedule.kind === "date") { if (!validateDate(t.schedule.date)) return fail(); schedule = { kind: "date", date: t.schedule.date }; }
  else if (t.schedule.kind === "sowing") {
    if (!Number.isSafeInteger(t.schedule.offset_days) || Math.abs(t.schedule.offset_days) > 3650) return fail();
    validateDate(t.schedule.anchor_date); if (t.schedule.anchor_date) addDays(t.schedule.anchor_date,t.schedule.offset_days);
    schedule = { kind: "sowing", offset_days: t.schedule.offset_days, anchor_date: t.schedule.anchor_date };
  } else if (t.schedule.kind === "stage" && STAGES.includes(t.schedule.stage)) schedule = { kind: "stage", stage: t.schedule.stage };
  else return fail();
  return { id:t.id, schema_version:1, created_at:t.created_at, updated_at:t.updated_at, origin:t.origin, cycle_id:t.cycle_id, title:t.title, schedule, status:t.status, completed_at:t.completed_at };
}
export function rescheduleTasks(tasks: CalendarTask[], cycle: CropCycle, choice: "shift" | "keep", now: string) {
  return tasks.map(task => task.cycle_id === cycle.id && task.status === "pending" && task.schedule.kind === "sowing" && choice === "shift" ? { ...task, schedule: { ...task.schedule, anchor_date: cycle.sowing_date }, updated_at: now } : task);
}
export function reschedulePreview(tasks: CalendarTask[], cycle: CropCycle) {
  return tasks.filter(t => t.cycle_id === cycle.id && t.status === "pending" && t.schedule.kind === "sowing" && t.schedule.anchor_date !== cycle.sowing_date).map(task => ({ id: task.id, title: task.title, before: dueDate(task), after: cycle.sowing_date && task.schedule.kind === "sowing" ? addDays(cycle.sowing_date,task.schedule.offset_days) : null }));
}

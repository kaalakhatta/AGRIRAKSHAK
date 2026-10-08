import { parseBackup, type FarmData } from './farm.ts';
export function recordCounts(data:FarmData){return {farms:data.farms.length,fields:data.fields.length,cycles:data.cycles.length,reminders:data.tasks.length,screenings:data.scans.length,soil_tests:data.soil_tests.length,expenses:data.expenses.length,harvests:data.harvests.length,sales:data.sales.length,observations:data.observations.length,feedback:data.feedback.length};}
export function checkBackup(raw:string){const backup=parseBackup(raw);return {backup,counts:recordCounts(backup.data)};}

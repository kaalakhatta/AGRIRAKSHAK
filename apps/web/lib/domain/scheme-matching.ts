import { GOVERNMENT_SCHEMES, type AnswerKey, type GovernmentScheme } from '../content/scheme-catalog.ts';
import type { CropCycle, Field } from './farm.ts';

export type SchemeAnswers = Partial<Record<AnswerKey, string>> & { state?: 'mp' | 'other' | 'unknown' };
export type SchemeDecision = { scheme: GovernmentScheme; status: 'potential' | 'needs_info' | 'not_matching' | 'verify'; reasons: string[]; missing: string[]; cautions: string[] };
export const SCHEME_STATUS = { potential: 'Potential match', needs_info: 'More details needed', not_matching: 'Does not match these conditions', verify: 'Check with the office' } as const;
const validAnswer = (key: AnswerKey, value: string) => (key === 'tenure' ? ['owner', 'tenant', 'sharecropper', 'other'] : key === 'land_date' ? ['before', 'inheritance', 'other'] : ['yes', 'no']).includes(value);
export function fieldState(region: string | null): 'mp' | 'unknown' {
  return region && /(?:^|[,\s])(?:madhya\s+pradesh|mp|मध्य\s*प्रदेश)(?:$|[,\s])/i.test(region.trim()) ? 'mp' : 'unknown';
}
export function schemeCrop(crop: string | null | undefined): string | null {
  const value = crop?.trim().toLowerCase();
  if (!value) return null;
  const aliases: Record<string, string> = { 'gram/chickpea': 'chickpea', 'gram / chickpea': 'chickpea', gram: 'chickpea', paddy: 'rice', 'oil palm': 'oil-palm' };
  return aliases[value] ?? value;
}
// Pure screening of known conditions; missing answers and authority checks are explicit.
// Never uses GPS, weather, inferred identity, per-field area as total landholding, or paid APIs.
export function matchGovernmentSchemes(field: Field, cycle: CropCycle | null, answers: SchemeAnswers, now = new Date()): SchemeDecision[] {
  const state = fieldState(field.region) === 'mp' ? 'mp' : ['mp', 'other'].includes(answers.state ?? '') ? answers.state : 'unknown';
  const crop = cycle?.field_id === field.id ? schemeCrop(cycle.crop) : null;
  const district = field.region?.replace(/[,\s]*(?:Madhya\s+Pradesh|MP|मध्य\s*प्रदेश)\s*$/i, '').trim();
  return GOVERNMENT_SCHEMES.map(scheme => {
    const reasons: string[] = [], missing: string[] = [], failures: string[] = [];
    if (state === 'unknown') missing.push('Confirm the field’s state without sharing coordinates.');
    else if (state === 'other') failures.push('This matching service currently covers farmers in Madhya Pradesh. National programmes may still apply; consult their official portals.');
    else reasons.push('The selected field is in Madhya Pradesh.');
    for (const rule of scheme.conditions) {
      const value = answers[rule.key];
      if (!value || !validAnswer(rule.key, value)) missing.push(rule.question);
      else if (rule.accepted.includes(value)) reasons.push(rule.reason);
      else failures.push(rule.mismatch);
    }
    if (scheme.crops) {
      if (!crop) missing.push('Choose a crop cycle for this field.');
      else if (scheme.crops.includes(crop)) reasons.push(`Your ${cycle!.crop} cycle falls within the listed crop group.`);
      else failures.push(`The selected ${cycle!.crop} crop is outside the crop groups screened for this programme. Check the official list for other components.`);
    }
    if (scheme.topic === 'insurance') {
      if (!district || district.toLowerCase() === 'madhya pradesh') missing.push('Add the district in My Farm to check the insurance notification.');
      if (!crop) missing.push('Choose a crop cycle for this field.');
      if (!cycle || cycle.field_id !== field.id || !cycle.season) missing.push('Record this crop cycle’s season in My Farm.');
      reasons.push('Insurance access also requires a current crop/area/season notification; this app has not verified one.');
    }
    const checked = Date.parse(`${scheme.checked_on}T00:00:00Z`), age = now.getTime() - checked;
    const stale = !Number.isFinite(age) || age < -86400000 || age > 90 * 86400000;
    const cautions = [...scheme.office_checks, scheme.availability, ...(stale ? ['Programme information needs rechecking before it can be treated as a potential match.'] : [])];
    const status: SchemeDecision['status'] = failures.length ? 'not_matching' : missing.length ? 'needs_info' : stale || scheme.screening === 'office' ? 'verify' : 'potential';
    return { scheme, status, reasons: [...failures, ...reasons], missing, cautions };
  });
}

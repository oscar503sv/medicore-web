/**
 * Commercial plan data (single source of truth for plan limits and add-ons).
 * Texts live in src/i18n/{es,en}.json under `pricing`.
 * This is presentation only: limits are NOT enforced by this site.
 */
export type PlanId = 'independiente' | 'clinica' | 'clinica-plus' | 'empresarial';
export type AddonId = 'vacunacion' | 'medicamentos' | 'procedimientos' | 'paquete';

export interface Plan {
  id: PlanId;
  doctors: number | null;
  supportUsers: number | null;
  sites: number | null;
  storageGb: number | null;
  featured?: boolean;
}

export const plans: Plan[] = [
  { id: 'independiente', doctors: 1, supportUsers: 1, sites: 1, storageGb: 2 },
  { id: 'clinica', doctors: 3, supportUsers: 3, sites: 1, storageGb: 3, featured: true },
  { id: 'clinica-plus', doctors: 5, supportUsers: 6, sites: 1, storageGb: 5 },
  { id: 'empresarial', doctors: null, supportUsers: null, sites: null, storageGb: null },
];

export const planIds = plans.map((p) => p.id) as [PlanId, ...PlanId[]];

export interface Addon {
  id: AddonId;
}

export const addons: Addon[] = [
  { id: 'vacunacion' },
  { id: 'medicamentos' },
  { id: 'procedimientos' },
  { id: 'paquete' },
];

/** Value tokens resolved through `pricing.compare.values` in the dictionaries. */
export type CompareToken =
  | 'yes'
  | 'no'
  | 'unlimited'
  | 'custom'
  | 'quote'
  | 'basic'
  | 'clinic'
  | 'operational'
  | 'soon'
  | 'conditions';

export type CompareCell =
  | { kind: 'token'; token: CompareToken }
  | { kind: 'number'; field: 'doctors' | 'supportUsers' | 'sites' }
  | { kind: 'storage' };

const t = (token: CompareToken): CompareCell => ({ kind: 'token', token });
const same = (cell: CompareCell): CompareCell[] => [cell, cell, cell, cell];

/** Rows of the comparison table, in plan order. Labels: `pricing.compare.rows[key]`. */
export const compareRows: { key: string; cells: CompareCell[] }[] = [
  { key: 'doctors', cells: same({ kind: 'number', field: 'doctors' }) },
  { key: 'support', cells: same({ kind: 'number', field: 'supportUsers' }) },
  { key: 'sites', cells: same({ kind: 'number', field: 'sites' }) },
  { key: 'patients', cells: same(t('unlimited')) },
  { key: 'visits', cells: same(t('unlimited')) },
  { key: 'records', cells: same(t('yes')) },
  { key: 'schedule', cells: same(t('yes')) },
  { key: 'frontDesk', cells: same(t('yes')) },
  { key: 'prescriptions', cells: same(t('yes')) },
  { key: 'icd', cells: same(t('yes')) },
  { key: 'roles', cells: same(t('yes')) },
  { key: 'dashboard', cells: [t('basic'), t('clinic'), t('operational'), t('operational')] },
  { key: 'reports', cells: [t('no'), t('no'), t('yes'), t('yes')] },
  { key: 'storage', cells: same({ kind: 'storage' }) },
  { key: 'priority', cells: [t('no'), t('no'), t('yes'), t('yes')] },
];

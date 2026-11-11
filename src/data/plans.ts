/**
 * Commercial plan data (single source of truth for prices and limits).
 * Texts live in src/i18n/{es,en}.json under `pricing`.
 * This is presentation only: limits are NOT enforced by this site.
 */
export type PlanId = 'independiente' | 'clinica' | 'clinica-plus' | 'empresarial';
export type AddonId = 'vacunacion' | 'medicamentos' | 'procedimientos' | 'paquete';

export interface Plan {
  id: PlanId;
  /** Monthly price in USD; null = custom quote. */
  price: number | null;
  doctors: number | null;
  supportUsers: number | null;
  sites: number | null;
  storageGb: number | null;
  featured?: boolean;
}

export const plans: Plan[] = [
  { id: 'independiente', price: 39, doctors: 1, supportUsers: 1, sites: 1, storageGb: 2 },
  { id: 'clinica', price: 79, doctors: 3, supportUsers: 3, sites: 1, storageGb: 3, featured: true },
  { id: 'clinica-plus', price: 119, doctors: 5, supportUsers: 6, sites: 1, storageGb: 5 },
  { id: 'empresarial', price: null, doctors: null, supportUsers: null, sites: null, storageGb: null },
];

export const planIds = plans.map((p) => p.id) as [PlanId, ...PlanId[]];

export interface Addon {
  id: AddonId;
  price: number;
}

export const addons: Addon[] = [
  { id: 'vacunacion', price: 10 },
  { id: 'medicamentos', price: 15 },
  { id: 'procedimientos', price: 15 },
  { id: 'paquete', price: 29 },
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
  | { kind: 'price' }
  | { kind: 'number'; field: 'doctors' | 'supportUsers' | 'sites' }
  | { kind: 'storage' };

const t = (token: CompareToken): CompareCell => ({ kind: 'token', token });
const same = (cell: CompareCell): CompareCell[] => [cell, cell, cell, cell];

/** Rows of the comparison table, in plan order. Labels: `pricing.compare.rows[key]`. */
export const compareRows: { key: string; cells: CompareCell[] }[] = [
  { key: 'price', cells: same({ kind: 'price' }) },
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
  { key: 'reports', cells: [t('no'), t('no'), t('soon'), t('soon')] },
  { key: 'storage', cells: same({ kind: 'storage' }) },
  { key: 'priority', cells: [t('no'), t('no'), t('yes'), t('yes')] },
];

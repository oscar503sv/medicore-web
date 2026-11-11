/**
 * Cookie consent (first-party, no third-party libs). CURRENTLY DISABLED:
 * the site sets no non-essential cookies. To re-enable, render
 * <CookieBanner /> in src/layouts/Base.astro and restore the footer button.
 *
 * The choice is stored in the essential cookie `mc_consent` ("all" | "essential")
 * for 180 days. Non-essential scripts (analytics, etc.) must only run after
 * `onConsent('analytics', ...)` fires.
 *
 * To add analytics later, register it in `loaders` below and allow its
 * domains in the CSP (vercel.json).
 */
export type ConsentLevel = 'all' | 'essential';
export type Category = 'analytics';

const COOKIE = 'mc_consent';
const MAX_AGE = 60 * 60 * 24 * 180;
const EVENT = 'mc:consent';

export function getConsent(): ConsentLevel | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(all|essential)`));
  return (match?.[1] as ConsentLevel | undefined) ?? null;
}

export function setConsent(level: ConsentLevel): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${level}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  document.dispatchEvent(new CustomEvent<ConsentLevel>(EVENT, { detail: level }));
}

export function hasConsent(_category: Category): boolean {
  return getConsent() === 'all';
}

/** Runs `cb` now if consent was already given, or as soon as it is. */
export function onConsent(category: Category, cb: () => void): void {
  if (hasConsent(category)) {
    cb();
    return;
  }
  const handler = () => {
    if (hasConsent(category)) {
      document.removeEventListener(EVENT, handler);
      cb();
    }
  };
  document.addEventListener(EVENT, handler);
}

/** Hook point for non-essential scripts. Empty for now: no analytics installed. */
const loaders: Partial<Record<Category, () => void>> = {
  // analytics: () => { /* inject the analytics script here */ },
};

export function initConsentLoaders(): void {
  (Object.keys(loaders) as Category[]).forEach((category) => {
    const load = loaders[category];
    if (load) onConsent(category, load);
  });
}

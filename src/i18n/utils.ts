import es from './es.json';
import en from './en.json';

export const languages = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'es';

export type Dictionary = typeof es;
const dictionaries: Record<Lang, Dictionary> = { es, en };

/** Equivalent URL of every page in each locale (used for the switcher and hreflang). */
export const routes = {
  home: { es: '/', en: '/en/' },
  privacy: { es: '/privacidad/', en: '/en/privacy/' },
  terms: { es: '/terminos/', en: '/en/terms/' },
  thanks: { es: '/gracias/', en: '/en/thanks/' },
  demoError: { es: '/error-demo/', en: '/en/demo-error/' },
  notFound: { es: '/404/', en: '/404/' },
} as const satisfies Record<string, Record<Lang, string>>;
export type RouteKey = keyof typeof routes;

export const ogLocale: Record<Lang, string> = { es: 'es_SV', en: 'en_US' };

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return first === 'en' ? 'en' : defaultLang;
}

export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function isLang(value: unknown): value is Lang {
  return value === 'es' || value === 'en';
}

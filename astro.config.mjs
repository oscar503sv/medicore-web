// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://medicoresv.health',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      DEMO_FROM: envField.string({ context: 'server', access: 'secret', default: 'Medicore <demo@medicoresv.health>' }),
      DEMO_TO: envField.string({ context: 'server', access: 'secret', default: 'hello@medicoresv.health' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-SV', en: 'en-US' } },
      filter: (page) => !/\/(gracias|thanks|error-demo|demo-error|404)\/?$/.test(page),
      // Pages whose slug differs per locale need their hreflang pairs added by hand.
      serialize(item) {
        const pairs = [
          ['/privacidad/', '/en/privacy/'],
          ['/terminos/', '/en/terms/'],
        ];
        const path = new URL(item.url).pathname;
        const pair = pairs.find((p) => p.includes(path));
        if (pair) {
          const site = 'https://medicoresv.health';
          item.links = [
            { lang: 'es-SV', url: site + pair[0] },
            { lang: 'en-US', url: site + pair[1] },
          ];
        }
        return item;
      },
    }),
  ],
  build: { inlineStylesheets: 'always' },
  vite: {
    // Never inline scripts/fonts as data: URIs, so the strict CSP
    // (script-src 'self'; font-src 'self') keeps working.
    build: { assetsInlineLimit: 0 },
  },
});

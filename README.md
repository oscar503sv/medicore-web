# Medicore Web

Sitio de marketing de [Medicore](https://medicoresv.health), el software de gestión clínica para consultorios y clínicas de El Salvador. Está disponible en español (`/`) y en inglés (`/en/`).

Hecho con [Astro](https://astro.build) y desplegado en Vercel.

## Empezar

Requiere Node 24 (ver `.nvmrc`).

```bash
npm install
npm run dev
```

Abre http://localhost:4321.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila el sitio para producción |
| `npm run check` | Revisa tipos y errores |
| `npm run og` | Regenera favicon, iconos e imágenes para redes sociales |

## Dónde cambiar cosas

- **Textos (ES/EN):** `src/i18n/es.json` y `src/i18n/en.json`
- **Planes y precios:** `src/data/plans.ts`
- **Colores y tipografía:** `src/styles/global.css`
- **Páginas legales:** `src/pages/privacidad.md`, `src/pages/terminos.md` y sus versiones en `src/pages/en/`

## Formulario de demo

Las solicitudes se envían por correo con [Resend](https://resend.com). Configura estas variables en Vercel (ver `.env.example`):

- `RESEND_API_KEY`: obligatoria en producción
- `DEMO_FROM` y `DEMO_TO`: remitente y destinatario
- `PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`: antispam opcional de Cloudflare

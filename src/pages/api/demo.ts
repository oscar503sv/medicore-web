import type { APIRoute } from 'astro';
import { RESEND_API_KEY, DEMO_FROM, DEMO_TO, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { demoSchema, type DemoField, type DemoRequest } from '../../lib/demo-schema';
import { routes, isLang, useTranslations, type Lang } from '../../i18n/utils';

export const prerender = false;

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Best-effort, per-instance rate limit. Serverless instances don't share
 * memory, so for a hard guarantee add a Vercel WAF rate-limit rule (or a
 * shared store such as Upstash Redis) in front of /api/demo.
 */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT;
}

function clientIp(request: Request, fallback: string | undefined): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || fallback || 'unknown';
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const oneLine = (value: string) => value.replace(/[\r\n\t]+/g, ' ').trim();

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function sendEmail(data: DemoRequest): Promise<boolean> {
  if (!RESEND_API_KEY) {
    if (import.meta.env.DEV) {
      console.info('[demo] RESEND_API_KEY not set; request received (dev only):', data);
      return true;
    }
    console.error('[demo] RESEND_API_KEY is not configured');
    return false;
  }

  const rows: [string, string | undefined][] = [
    ['Nombre', data.name],
    ['Clínica o consultorio', data.clinic],
    ['Correo', data.email],
    ['WhatsApp', data.phone],
    ['Plan de interés', data.plan && useTranslations('es').pricing.plans[data.plan].name],
    ['Idioma', data.lang.toUpperCase()],
    ['Comentario', data.comment],
  ];
  const html = `<h2 style="font-family:sans-serif">Nueva solicitud de demo</h2>
<table cellpadding="6" style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
${rows
  .map(
    ([k, v]) =>
      `<tr><th align="left" valign="top">${k}</th><td style="white-space:pre-wrap">${v ? escapeHtml(v) : '—'}</td></tr>`,
  )
  .join('\n')}
</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v ?? '—'}`).join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: DEMO_FROM,
        to: [DEMO_TO],
        reply_to: data.email,
        subject: oneLine(
          `${data.plan ? `Solicitud de plan ${useTranslations('es').pricing.plans[data.plan].name}` : 'Solicitud de demo'}: ${data.clinic} (${data.name})`,
        ).slice(0, 200),
        html,
        text,
      }),
    });
    if (!res.ok) console.error('[demo] Resend error', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('[demo] Resend request failed', err);
    return false;
  }
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') out[key] = value;
  return out;
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let lang: Lang = 'es';

  const respond = (status: number, body: Record<string, unknown>) => {
    if (wantsJson) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    // No-JS fallback: redirect to a static confirmation/error page (PRG).
    const target = body.ok ? routes.thanks[lang] : routes.demoError[lang];
    return Response.redirect(new URL(target, url), 303);
  };

  // Reject cross-site posts (CSRF / form spam from other origins).
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return respond(403, { ok: false, error: 'forbidden' });

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return respond(413, { ok: false, error: 'too_large' });

  let raw: Record<string, string>;
  try {
    raw = await readBody(request);
  } catch {
    return respond(400, { ok: false, error: 'bad_request' });
  }
  if (isLang(raw.lang)) lang = raw.lang;

  // Honeypot: bots fill every field. Pretend success and drop it.
  if (raw.website) return respond(200, { ok: true });

  const ip = clientIp(request, clientAddress);
  if (rateLimited(ip)) return respond(429, { ok: false, error: 'rate_limited' });

  const parsed = demoSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Partial<Record<DemoField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && field !== 'lang') errors[field as DemoField] = 'invalid';
    }
    return respond(400, { ok: false, errors });
  }

  if (!(await verifyTurnstile(raw['cf-turnstile-response'], ip))) {
    return respond(400, { ok: false, errors: { captcha: 'invalid' } });
  }

  const sent = await sendEmail(parsed.data);
  if (!sent) return respond(502, { ok: false, error: 'delivery_failed' });

  return respond(200, { ok: true });
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'application/json' },
  });

import { z } from 'zod';
import { planIds } from '../data/plans';

export const PHONE_PATTERN = '^\\+?[0-9\\s-]{8,20}$';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (schema: z.ZodString) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(schema.optional());

export const demoSchema = z.object({
  name: trimmed(2, 100),
  clinic: trimmed(2, 120),
  email: z.string().trim().max(254).pipe(z.email()),
  phone: optionalText(z.string().regex(new RegExp(PHONE_PATTERN))),
  comment: optionalText(z.string().max(1000)),
  plan: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.enum(planIds).optional()),
  lang: z.enum(['es', 'en']).default('es'),
});

export type DemoRequest = z.infer<typeof demoSchema>;
export type DemoField = 'name' | 'clinic' | 'email' | 'phone' | 'comment' | 'captcha';

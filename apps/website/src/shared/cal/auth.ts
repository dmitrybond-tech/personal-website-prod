// apps/website/src/shared/cal/auth.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const CAL_SIGNATURE_HEADER = 'x-cal-signature-256' as const;

export type VerifyResult =
  | { ok: true; mode: 'verified' | 'dev-unsigned-accepted' }
  | { ok: false; status: 401 | 400; reason: 'missing-secret' | 'missing-signature' | 'bad-signature' };

export function getCalWebhookSecret(): string | undefined {
  const fromImport = (import.meta as any)?.env?.CAL_WEBHOOK_SECRET as string | undefined;
  const fromProcess = typeof process !== 'undefined' ? process.env.CAL_WEBHOOK_SECRET : undefined;
  return fromImport ?? fromProcess;
}

export function isDev(): boolean {
  return (import.meta as any)?.env?.DEV === true || process.env.NODE_ENV !== 'production';
}

export function signHmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string | undefined): VerifyResult {
  const dev = isDev();

  if (!secret || secret.length === 0) {
    if (dev) return { ok: true, mode: 'dev-unsigned-accepted' };
    return { ok: false, status: 400, reason: 'missing-secret' };
  }

  if (!signatureHeader) {
    return { ok: false, status: 401, reason: 'missing-signature' };
  }

  const expected = Buffer.from(signHmacSha256Hex(secret, rawBody), 'utf8');
  const received = Buffer.from(signatureHeader, 'utf8');

  if (expected.length !== received.length) {
    return { ok: false, status: 401, reason: 'bad-signature' };
  }
  const equal = timingSafeEqual(expected, received);
  return equal ? { ok: true, mode: 'verified' } : { ok: false, status: 401, reason: 'bad-signature' };
}

/** Читать raw body ДО JSON.parse — иначе подпись не сойдётся */
export async function readRawBody(req: Request): Promise<string> {
  return await req.text();
}

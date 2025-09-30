// apps/website/src/pages/api/cal/webhook.ts
export const prerender = false;

import type { APIContext } from 'astro';
import { CAL_SIGNATURE_HEADER, getCalWebhookSecret, readRawBody, verifyCalSignature, isDev } from '@shared/cal/auth';

interface CalWebhookEvent {
  triggerEvent?: string;
  type?: string;
  payload?: {
    type?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    attendee?: any;
    organizer?: any;
    uid?: string;
    id?: number;
    booking?: {
      id?: number;
    };
  };
}

export async function POST({ request }: APIContext) {
  try {
    const raw = await readRawBody(request);
    const sig = request.headers.get(CAL_SIGNATURE_HEADER);
    const secret = getCalWebhookSecret();

    const vr = verifyCalSignature(raw, sig, secret);
    if (!vr.ok) {
      return new Response(JSON.stringify({ ok: false, reason: vr.reason }), {
        status: vr.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    const evt = JSON.parse(raw);
    // TODO: идемпотентность (triggerEvent/uid/createdAt), очередь/обработка
    return new Response(JSON.stringify({ ok: true, mode: vr.mode }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[cal-webhook] handler-error', { msg: String(err?.message ?? err) });
    return new Response(JSON.stringify({ ok: false, error: 'internal-error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}


export async function GET({ request }: APIContext) {
  // Health-check только в DEV
  if (!isDev()) return new Response(null, { status: 404 });
  const hasSecret = Boolean(getCalWebhookSecret());
  return new Response(
    JSON.stringify({ ok: true, env: isDev() ? 'dev' : 'prod', hasSecret, signatureHeader: CAL_SIGNATURE_HEADER }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, HEAD, OPTIONS',
      'access-control-allow-headers': 'content-type, x-cal-signature-256'
    }
  });
}


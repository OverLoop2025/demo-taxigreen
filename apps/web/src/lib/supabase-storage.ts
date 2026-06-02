import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const BUCKET = 'comprobantes';
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;

export type StorageResult =
  | {
      ok: true;
      path: string;
      signedUrl: string;
    }
  | {
      ok: false;
      reason: 'missing_env' | 'upload_failed' | 'signed_url_failed';
      message?: string;
    };

function adminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function uploadComprobantePdf(path: string, pdf: Buffer): Promise<StorageResult> {
  const client = adminClient();
  if (!client) {
    return { ok: false, reason: 'missing_env' };
  }

  const upload = await client.storage.from(BUCKET).upload(path, pdf, {
    cacheControl: '86400',
    contentType: 'application/pdf',
    upsert: true,
  });

  if (upload.error) {
    return { ok: false, reason: 'upload_failed', message: upload.error.message };
  }

  const signed = await client.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signed.error || !signed.data?.signedUrl) {
    return { ok: false, reason: 'signed_url_failed', message: signed.error?.message };
  }

  return { ok: true, path, signedUrl: signed.data.signedUrl };
}

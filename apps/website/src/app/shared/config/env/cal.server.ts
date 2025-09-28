// server-only loader: НЕ импортировать из клиентских скриптов
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  // приоритет локального файла; fallback на example (удобно для CI)
  const localPath = join(process.cwd(), 'env', 'cal.local.env');
  const examplePath = join(process.cwd(), 'env', 'cal.example.env');

  if (existsSync(localPath)) dotenv.config({ path: localPath });
  else if (existsSync(examplePath)) dotenv.config({ path: examplePath });

  loaded = true;
}

export function getCalSecrets() {
  ensureLoaded();
  const CAL_WEBHOOK_SECRET = process.env.CAL_WEBHOOK_SECRET || '';
  const CAL_API_TOKEN = process.env.CAL_API_TOKEN || '';
  const DEV_SKIP = process.env.CAL_WEBHOOK_DEV_SKIP_VERIFY === '1';

  if (!CAL_WEBHOOK_SECRET && !DEV_SKIP) {
    console.warn(
      '[cal] CAL_WEBHOOK_SECRET is empty; set CAL_WEBHOOK_DEV_SKIP_VERIFY=1 to bypass signature in dev'
    );
  }
  return { CAL_WEBHOOK_SECRET, CAL_API_TOKEN, DEV_SKIP };
}
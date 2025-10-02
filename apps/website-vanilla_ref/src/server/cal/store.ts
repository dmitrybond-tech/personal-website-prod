// apps/website/src/server/cal/store.ts
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = '.cal-logs';

/**
 * Сохраняет событие вебхука в файл для отладки
 * @param obj - объект события для логирования
 * @returns путь к созданному файлу
 */
export async function appendEventLog(obj: unknown): Promise<string> {
  // Создаем директорию для логов если её нет
  await mkdir(DIR, { recursive: true });
  
  // Генерируем уникальное имя файла с временной меткой
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fp = join(DIR, `event-${ts}.json`);
  
  // Записываем событие в JSON формате
  await writeFile(fp, JSON.stringify(obj, null, 2), 'utf8');
  
  return fp;
}

/**
 * Типы событий Cal.com для типизации
 */
export interface CalWebhookEvent {
  triggerEvent: string;
  payload: {
    type?: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    attendee?: {
      name?: string;
      email?: string;
    };
    organizer?: {
      name?: string;
      email?: string;
    };
    [key: string]: unknown;
  };
  createdAt?: string;
  [key: string]: unknown;
}

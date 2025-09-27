// apps/website/src/pages/api/cal/webhook.ts
export const prerender = false;

import { verifyCalSignature } from '@/server/cal/verify';
import { appendEventLog, type CalWebhookEvent } from '@/server/cal/store';
import type { BookingType } from '@/app/shared/config/cal/config';

// Маппинг slug'ов Cal.com на наши типы встреч
// TODO: Замените на реальные slug'и из вашего Cal.com
const slugToType = new Map<string, BookingType>([
  // Примеры - замените на ваши реальные slug'и:
  ['interview-30m', 'interview'],
  ['interview-30min', 'interview'],
  ['tech-90m', 'tech'],
  ['tech-90min', 'tech'],
  ['mentoring-60m', 'mentoring'],
  ['mentoring-60min', 'mentoring'],
  // Добавьте другие варианты slug'ов если нужно
]);

/**
 * Обработчик вебхука Cal.com
 * Валидирует подпись, нормализует события и логирует их
 */
export async function POST({ request }: { request: Request }) {
  try {
    // Читаем сырое тело запроса (важно для проверки подписи)
    const raw = await request.text();
    const headers = request.headers;
    
    // Получаем настройки из переменных окружения
    const devSkip = process.env.CAL_WEBHOOK_DEV_SKIP_VERIFY === '1';
    const secret = process.env.CAL_WEBHOOK_SECRET || '';
    const signature = headers.get('x-cal-signature-256');

    // Проверяем подпись (если не в dev режиме)
    const isValidSignature = devSkip || verifyCalSignature(raw, signature, secret);
    
    if (!isValidSignature) {
      console.error('[Cal Webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Парсим JSON событие
    let event: CalWebhookEvent;
    try {
      event = JSON.parse(raw);
    } catch (error) {
      console.error('[Cal Webhook] Invalid JSON:', error);
      return new Response('Invalid JSON', { status: 400 });
    }

    const trigger = event?.triggerEvent;
    const payload = event?.payload || {};

    // Нормализация к нашим типам встреч
    // Cal.com присылает slug типа встречи в payload.type
    const slug: string | undefined = payload?.type;
    const bookingType = slug ? slugToType.get(slug) : undefined;

    // Подготавливаем данные для логирования
    const logData = {
      timestamp: new Date().toISOString(),
      trigger,
      slug,
      bookingType,
      payload: {
        type: payload.type,
        title: payload.title,
        startTime: payload.startTime,
        endTime: payload.endTime,
        attendee: payload.attendee,
        organizer: payload.organizer,
      },
      // Сохраняем полное событие для отладки
      fullEvent: event,
    };

    // Логируем событие
    const logPath = await appendEventLog(logData);
    console.log(`[Cal Webhook] Event logged: ${logPath}`);

    // TODO: Здесь можно добавить интеграции:
    // - Отправка уведомлений в Telegram
    // - Создание записей в Notion
    // - Сохранение в базу данных
    // - Отправка follow-up писем
    // - Аналитика и метрики

    // Пример обработки разных типов событий
    switch (trigger) {
      case 'BOOKING_CREATED':
        console.log(`[Cal Webhook] New booking created: ${bookingType} at ${payload.startTime}`);
        // Здесь можно добавить специфичную логику для новых бронирований
        break;
      case 'BOOKING_RESCHEDULED':
        console.log(`[Cal Webhook] Booking rescheduled: ${bookingType}`);
        // Логика для переносов
        break;
      case 'BOOKING_CANCELLED':
        console.log(`[Cal Webhook] Booking cancelled: ${bookingType}`);
        // Логика для отмен
        break;
      default:
        console.log(`[Cal Webhook] Unknown trigger: ${trigger}`);
    }

    // Возвращаем успешный ответ
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        trigger, 
        bookingType,
        slug,
        log: logPath,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Cal Webhook] Unexpected error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

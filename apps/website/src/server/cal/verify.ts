// apps/website/src/server/cal/verify.ts
import crypto from 'node:crypto';

/**
 * Проверяет подпись HMAC-SHA256 от Cal.com с timing-safe сравнением
 * @param rawBody - сырое тело запроса (строка)
 * @param signatureHeader - заголовок x-cal-signature-256 (case-insensitive)
 * @param secret - секретный ключ из настроек Cal.com
 * @returns true если подпись валидна
 */
export function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  // Вычисляем ожидаемую подпись
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  
  // Создаем буферы для timing-safe сравнения
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(signatureHeader.trim(), 'hex');
  
  // Проверяем, что буферы одинаковой длины
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  
  // Используем timing-safe сравнение
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

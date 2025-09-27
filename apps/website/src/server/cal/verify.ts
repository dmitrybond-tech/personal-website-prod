// apps/website/src/server/cal/verify.ts
import crypto from 'node:crypto';

/**
 * Проверяет подпись HMAC-SHA256 от Cal.com
 * @param rawBody - сырое тело запроса (строка)
 * @param signatureHeader - заголовок x-cal-signature-256
 * @param secret - секретный ключ из настроек Cal.com
 * @returns true если подпись валидна
 */
export function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  // Cal.com использует HMAC-SHA256 для подписи
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  
  // Cal.com может отправлять подпись в разных форматах
  // Проверяем точное совпадение или включение ожидаемого хэша
  return signatureHeader === expected || signatureHeader.includes(expected);
}

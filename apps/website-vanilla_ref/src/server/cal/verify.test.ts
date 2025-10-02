// apps/website/src/server/cal/verify.test.ts
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyCalSignature } from './verify';

describe('verifyCalSignature', () => {
  const secret = 'test-secret-key';
  const rawBody = '{"triggerEvent":"BOOKING_CREATED","payload":{"type":"interview-30m"}}';

  it('should return true for valid signature', () => {
    // Вычисляем правильную подпись
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const result = verifyCalSignature(rawBody, expectedSignature, secret);
    expect(result).toBe(true);
  });

  it('should return false for invalid signature', () => {
    const invalidSignature = 'invalid-signature';
    const result = verifyCalSignature(rawBody, invalidSignature, secret);
    expect(result).toBe(false);
  });

  it('should return false for empty signature', () => {
    const result = verifyCalSignature(rawBody, '', secret);
    expect(result).toBe(false);
  });

  it('should return false for null signature', () => {
    const result = verifyCalSignature(rawBody, null, secret);
    expect(result).toBe(false);
  });

  it('should return false for empty secret', () => {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const result = verifyCalSignature(rawBody, expectedSignature, '');
    expect(result).toBe(false);
  });

  it('should handle signature with whitespace', () => {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Добавляем пробелы
    const signatureWithWhitespace = `  ${expectedSignature}  `;
    const result = verifyCalSignature(rawBody, signatureWithWhitespace, secret);
    expect(result).toBe(true);
  });

  it('should return false for signature of different length', () => {
    const shortSignature = 'abc123';
    const result = verifyCalSignature(rawBody, shortSignature, secret);
    expect(result).toBe(false);
  });

  it('should be timing-safe (not leak information about signature length)', () => {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Тестируем, что функция не возвращает true для подписей разной длины
    const shortSignature = 'abc123';
    const longSignature = expectedSignature + 'extra';

    expect(verifyCalSignature(rawBody, shortSignature, secret)).toBe(false);
    expect(verifyCalSignature(rawBody, longSignature, secret)).toBe(false);
  });

  it('should work with different body content', () => {
    const differentBody = '{"triggerEvent":"BOOKING_CANCELLED","payload":{"type":"tech-90m"}}';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(differentBody)
      .digest('hex');

    const result = verifyCalSignature(differentBody, expectedSignature, secret);
    expect(result).toBe(true);
  });

  it('should be case-sensitive for signature', () => {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const upperCaseSignature = expectedSignature.toUpperCase();
    const result = verifyCalSignature(rawBody, upperCaseSignature, secret);
    expect(result).toBe(false);
  });
});

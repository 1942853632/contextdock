import { describe, expect, it } from 'vitest';
import { sanitize } from '../src/sanitizer';

describe('sanitizer', () => {
  it('redacts identifiers and common credentials', () => {
    const input = [
      'email me@example.com',
      'phone +86 138-0013-8000',
      'Authorization: Bearer abcdefghijklmnop',
      'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature',
      'key sk-test_1234567890abcdef',
      '-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'
    ].join('\n');
    const result = sanitize(input);
    expect(result.text).not.toContain('me@example.com');
    expect(result.text).not.toContain('138-0013-8000');
    expect(result.text).toContain('[REDACTED_EMAIL]');
    expect(result.text).toContain('[REDACTED_PHONE]');
    expect(result.text).toContain('[REDACTED_BEARER]');
    expect(result.text).toContain('[REDACTED_JWT]');
    expect(result.text).toContain('[REDACTED_API_KEY]');
    expect(result.text).toContain('[REDACTED_PRIVATE_KEY]');
    expect(result.report.total).toBe(6);
  });

  it('counts adjacent matches without leaking originals', () => {
    const result = sanitize('a@x.io b@y.io');
    expect(result.report.email).toBe(2);
    expect(result.report.total).toBe(2);
    expect(result.text).not.toMatch(/@[a-z]+\.io/);
  });
});

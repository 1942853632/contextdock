import { describe, expect, it } from 'vitest';
import { buildPack, estimateTokens, stableHash, toJson, toMarkdown } from '../src/model';

describe('context pack', () => {
  it('deduplicates, reports duplicates, and chunks', () => {
    const pack = buildPack({ title: 'Docs', url: 'https://x.test', capturedAt: 'now', selected: false, markdown: '# A\nSame\nSame\nLong text' }, 12);
    expect(pack.schemaVersion).toBe(1);
    expect(pack.sections.join('\n')).not.toMatch(/Same[\s\S]*Same/);
    expect(pack.sections.length).toBeGreaterThan(1);
    expect(pack.quality.duplicateRatio).toBeGreaterThan(0);
    expect(pack.sections.every(section => section.length <= 12)).toBe(true);
  });

  it('creates a stable identity hash', () => {
    expect(stableHash('same input')).toBe(stableHash('same input'));
    expect(stableHash('same input')).not.toBe(stableHash('different input'));
  });

  it('keeps citation, quality, and redaction metadata in exports', () => {
    const pack = buildPack({ title: 'T', url: 'https://x.test', capturedAt: 'd', selected: true, markdown: '# body\nemail me@example.com' });
    expect(estimateTokens('12345678')).toBe(2);
    expect(toMarkdown(pack)).toContain('Source: https://x.test');
    expect(toMarkdown(pack)).toContain('Quality:');
    expect(JSON.parse(toJson(pack))).toMatchObject({ schemaVersion: 1, sourceUrl: 'https://x.test', redactions: expect.any(Object) });
  });
});

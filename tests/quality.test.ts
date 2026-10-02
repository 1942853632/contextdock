import { describe, expect, it } from 'vitest';
import { analyzeQuality } from '../src/quality';

describe('quality analysis', () => {
  it('reports explainable content metrics', () => {
    const report = analyzeQuality('# Title\n\nBody\n```\nconst x = 1\n```', 0.25);
    expect(report.characterCount).toBeGreaterThan(0);
    expect(report.headingCount).toBe(1);
    expect(report.codeBlockCount).toBe(1);
    expect(report.duplicateRatio).toBe(0.25);
    expect(report.sectionCount).toBe(2);
    expect(report.warnings).toContain('high-duplicate-ratio');
    expect(report.score).toBeGreaterThan(0);
  });

  it('warns on empty, sparse, and headingless content', () => {
    expect(analyzeQuality('', 0).warnings).toEqual(['empty-content']);
    const report = analyzeQuality('just a short sentence', 0);
    expect(report.warnings).toContain('low-content-density');
    expect(report.warnings).toContain('missing-headings');
  });
});

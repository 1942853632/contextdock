import type { QualityReport } from './model';

export function analyzeQuality(text: string, duplicateRatio: number): QualityReport {
  const characterCount = text.length;
  if (!text.trim()) {
    return { score: 0, characterCount: 0, sectionCount: 0, duplicateRatio, headingCount: 0, codeBlockCount: 0, warnings: ['empty-content'] };
  }
  const sections = text.split(/\n{2,}/).filter(Boolean);
  const headingCount = (text.match(/^#{1,4} /gm) ?? []).length;
  const codeBlockCount = Math.floor((text.match(/```/g) ?? []).length / 2);
  const warnings: string[] = [];
  if (characterCount < 80) warnings.push('low-content-density');
  if (headingCount === 0) warnings.push('missing-headings');
  if (duplicateRatio >= 0.2) warnings.push('high-duplicate-ratio');
  const score = Math.max(0, Math.round(100 - duplicateRatio * 40 - (headingCount === 0 ? 15 : 0) - (characterCount < 80 ? 15 : 0)));
  return { score, characterCount, sectionCount: sections.length, duplicateRatio, headingCount, codeBlockCount, warnings };
}

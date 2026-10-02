import { sanitize } from './sanitizer';
import { analyzeQuality } from './quality';

export type PageSnapshot = { url: string; title: string; markdown: string; selected: boolean; capturedAt: string };
export type RedactionCategory = 'email' | 'phone' | 'bearer' | 'jwt' | 'apiKey' | 'privateKey';
export type RedactionReport = { total: number } & Record<RedactionCategory, number>;
export type QualityReport = { score: number; characterCount: number; sectionCount: number; duplicateRatio: number; headingCount: number; codeBlockCount: number; warnings: string[] };
export type ProcessedContent = { markdown: string; redactions?: RedactionReport; quality?: QualityReport; duplicateRatio?: number };
export type ContextPack = {
  schemaVersion: 1;
  title: string;
  sourceUrl: string;
  capturedAt: string;
  selected: boolean;
  sections: string[];
  tokenEstimate: number;
  contentHash: string;
  quality: QualityReport;
  redactions: RedactionReport;
};

export function estimateTokens(text: string): number { return Math.ceil(text.length / 4); }

export function stableHash(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function normalizeLines(markdown: string): { lines: string[]; duplicateRatio: number } {
  const lines = markdown.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) { seen.add(key); unique.push(line); }
  }
  return { lines: unique, duplicateRatio: lines.length ? (lines.length - unique.length) / lines.length : 0 };
}

export function buildPack(snapshot: PageSnapshot, maxChars = 12000, processed?: ProcessedContent): ContextPack {
  const sanitized = processed?.redactions ? { text: processed.markdown, report: processed.redactions } : sanitize(processed?.markdown ?? snapshot.markdown);
  const source = sanitized.text;
  const normalized = normalizeLines(source);
  const sections: string[] = [];
  let current = '';
  for (const line of normalized.lines) {
    if ((current + '\n' + line).length > maxChars && current) { sections.push(current); current = ''; }
    if (line.length > maxChars && !current) { for (let offset = 0; offset < line.length; offset += maxChars) sections.push(line.slice(offset, offset + maxChars)); continue; }
    current += (current ? '\n' : '') + line;
  }
  if (current) sections.push(current);
  const text = normalized.lines.join('\n');
  return {
    schemaVersion: 1,
    title: snapshot.title || 'Untitled page', sourceUrl: snapshot.url, capturedAt: snapshot.capturedAt, selected: snapshot.selected,
    sections, tokenEstimate: estimateTokens(text), contentHash: stableHash(text),
    quality: processed?.quality ?? analyzeQuality(text, normalized.duplicateRatio),
    redactions: sanitized.report
  };
}

export function toMarkdown(pack: ContextPack): string {
  const warningText = pack.quality.warnings.length ? pack.quality.warnings.join(', ') : 'none';
  return [`# ${pack.title}`, `Source: ${pack.sourceUrl}`, `Captured: ${pack.capturedAt}`, `Quality: ${pack.quality.score}/100 · ${pack.quality.characterCount} chars · ${pack.quality.sectionCount} sections`, `Warnings: ${warningText}`, `Redactions: ${pack.redactions.total}`, '', ...pack.sections].join('\n');
}

export function toJson(pack: ContextPack): string { return JSON.stringify(pack, null, 2); }

export type PageSnapshot = { url: string; title: string; markdown: string; selected: boolean; capturedAt: string };
export type ContextPack = { title: string; sourceUrl: string; capturedAt: string; sections: string[]; tokenEstimate: number };
export function estimateTokens(text: string): number { return Math.ceil(text.length / 4); }
export function buildPack(snapshot: PageSnapshot, maxChars = 12000): ContextPack {
  const lines = snapshot.markdown.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const unique: string[] = []; const seen = new Set<string>();
  for (const line of lines) { const key = line.toLowerCase().replace(/\s+/g, ' '); if (!seen.has(key)) { seen.add(key); unique.push(line); } }
  const sections: string[] = []; let current = '';
  for (const line of unique) { if ((current + '\n' + line).length > maxChars && current) { sections.push(current); current = ''; } current += (current ? '\n' : '') + line; }
  if (current) sections.push(current);
  return { title: snapshot.title || 'Untitled page', sourceUrl: snapshot.url, capturedAt: snapshot.capturedAt, sections, tokenEstimate: estimateTokens(unique.join('\n')) };
}
export function toMarkdown(pack: ContextPack): string { return [`# ${pack.title}`, `Source: ${pack.sourceUrl}`, `Captured: ${pack.capturedAt}`, '', ...pack.sections].join('\n'); }

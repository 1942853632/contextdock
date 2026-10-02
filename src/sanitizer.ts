import type { RedactionCategory, RedactionReport } from './model';

type Rule = { category: RedactionCategory; pattern: RegExp };

const rules: Rule[] = [
  { category: 'privateKey', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { category: 'bearer', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi },
  { category: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g },
  { category: 'apiKey', pattern: /\b(?:sk|pk|ghp|xoxb|AIza)[-_A-Za-z0-9]{10,}\b/g },
  { category: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { category: 'phone', pattern: /(?<!\w)(?:\+?\d{1,3}[ -]?)?(?:\d[ -]?){9,14}\d(?!\w)/g }
];

const emptyReport = (): RedactionReport => ({ total: 0, email: 0, phone: 0, bearer: 0, jwt: 0, apiKey: 0, privateKey: 0 });
const markerNames: Record<RedactionCategory, string> = { email: 'EMAIL', phone: 'PHONE', bearer: 'BEARER', jwt: 'JWT', apiKey: 'API_KEY', privateKey: 'PRIVATE_KEY' };

export function sanitize(text: string): { text: string; report: RedactionReport } {
  let sanitized = text;
  const report = emptyReport();
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    sanitized = sanitized.replace(rule.pattern, () => {
      report[rule.category] += 1;
      report.total += 1;
      return `[REDACTED_${markerNames[rule.category]}]`;
    });
  }
  return { text: sanitized, report };
}

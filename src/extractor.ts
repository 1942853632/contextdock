export function extractMarkdown(root: Document | HTMLElement = document): string {
  const clone = root.cloneNode(true) as Document | HTMLElement;
  clone.querySelectorAll?.('script,style,noscript,nav,footer,aside,form,svg,[aria-hidden="true"]').forEach(x => x.remove());
  const doc = clone as Document;
  const content = doc.querySelector('main,article,[role="main"]') ?? doc.body ?? clone;
  const blocks = Array.from(content.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,table')) as Element[];
  return blocks.map(node => { const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim(); if (!text) return ''; if (/^H[1-4]$/.test(node.tagName)) return `${'#'.repeat(Number(node.tagName.slice(1)))} ${text}`; if (node.tagName === 'LI') return `- ${text}`; if (node.tagName === 'PRE') return `\`\`\`\n${node.textContent?.trim()}\n\`\`\``; return text; }).filter(Boolean).join('\n\n');
}

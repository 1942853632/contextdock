import { createChromeHistoryStore } from './history';
import { buildPack, toJson, toMarkdown, type ContextPack, type PageSnapshot } from './model';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = $('status');
const historyStore = createChromeHistoryStore(chrome.storage.local);
let pack: ContextPack | null = null;

function renderPack(next: ContextPack) {
  pack = next;
  const source = $('source') as HTMLAnchorElement;
  $('title').textContent = next.title;
  source.textContent = next.sourceUrl;
  source.href = next.sourceUrl;
  $('stats').textContent = `${next.sections.length} sections · ~${next.tokenEstimate.toLocaleString()} tokens`;
  $('quality').textContent = `Quality: ${next.quality.score}/100 · ${next.quality.warnings.length} warnings`;
  $('quality').classList.toggle('warning', next.quality.warnings.length > 0);
  $('redactions').textContent = `Redactions: ${next.redactions.total}`;
  $('preview').textContent = toMarkdown(next);
}

function renderHistory(entries: ContextPack[]) {
  const list = $('historyList');
  list.replaceChildren();
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'No saved packs'; list.append(empty); return; }
  for (const entry of entries) {
    const row = document.createElement('div'); row.className = 'history-item';
    const info = document.createElement('div'); info.className = 'history-info';
    const title = document.createElement('div'); title.className = 'history-title'; title.textContent = entry.title;
    const time = document.createElement('div'); time.className = 'history-time'; time.textContent = new Date(entry.capturedAt).toLocaleString();
    info.append(title, time);
    const restore = document.createElement('button'); restore.type = 'button'; restore.textContent = 'Restore'; restore.dataset.action = 'restore'; restore.dataset.hash = entry.contentHash;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.dataset.action = 'delete'; remove.dataset.hash = entry.contentHash;
    row.append(info, restore, remove); list.append(row);
  }
}

async function refreshHistory() { renderHistory(await historyStore.list()); }

async function capture() {
  status.textContent = 'Capturing page…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error('No active tab');
  const snapshot = await chrome.tabs.sendMessage(tab.id, { type: 'capture' }) as PageSnapshot;
  const next = buildPack(snapshot, Number(($('maxChars') as HTMLInputElement).value) || 12000);
  renderPack(next); await historyStore.save(next); await refreshHistory();
  status.textContent = snapshot.selected ? 'Captured selection · saved locally' : 'Captured readable page · saved locally';
}

$('capture').addEventListener('click', () => capture().catch(error => { status.textContent = error instanceof Error ? error.message : 'Capture failed'; }));
$('copy').addEventListener('click', async () => { if (!pack) { status.textContent = 'Capture a page first'; return; } await navigator.clipboard.writeText(toMarkdown(pack)); status.textContent = 'Copied redacted Markdown'; });
$('download').addEventListener('click', () => { if (!pack) { status.textContent = 'Capture a page first'; return; } const blob = new Blob([toJson(pack)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'context-pack.json'; anchor.click(); URL.revokeObjectURL(url); status.textContent = 'Exported redacted JSON'; });
$('historyList').addEventListener('click', async event => { const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]'); if (!target?.dataset.hash) return; const entries = await historyStore.list(); const selected = entries.find(entry => entry.contentHash === target.dataset.hash); if (!selected) return; if (target.dataset.action === 'restore') { renderPack(selected); status.textContent = 'Restored local pack'; } else { await historyStore.remove(selected.contentHash); await refreshHistory(); status.textContent = 'Deleted local pack'; } });
$('clearHistory').addEventListener('click', async () => { await historyStore.clear(); await refreshHistory(); status.textContent = 'History cleared'; });
refreshHistory().catch(() => { status.textContent = 'History unavailable'; });

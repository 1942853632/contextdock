import type { ContextPack } from './model';

export const HISTORY_KEY = 'contextdock.history.v1';
export interface StorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(value: Record<string, unknown>): Promise<void>;
}
export interface HistoryStore {
  list(): Promise<ContextPack[]>;
  save(pack: ContextPack): Promise<void>;
  remove(contentHash: string): Promise<void>;
  clear(): Promise<void>;
}

const isPack = (value: unknown): value is ContextPack => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ContextPack>;
  return candidate.schemaVersion === 1 && typeof candidate.sourceUrl === 'string' && typeof candidate.contentHash === 'string' && Array.isArray(candidate.sections);
};

export function createHistoryStore(area: StorageAreaLike): HistoryStore {
  const read = async (): Promise<ContextPack[]> => {
    const result = await area.get(HISTORY_KEY);
    const raw = result[HISTORY_KEY];
    return Array.isArray(raw) ? raw.filter(isPack).slice(0, 20) : [];
  };
  const write = (entries: ContextPack[]) => area.set({ [HISTORY_KEY]: entries.slice(0, 20) });
  return {
    list: read,
    async save(pack) {
      const entries = await read();
      const withoutDuplicate = entries.filter(entry => !(entry.sourceUrl === pack.sourceUrl && entry.contentHash === pack.contentHash));
      await write([pack, ...withoutDuplicate]);
    },
    async remove(contentHash) { await write((await read()).filter(entry => entry.contentHash !== contentHash)); },
    async clear() { await write([]); }
  };
}

export function createChromeHistoryStore(area: chrome.storage.StorageArea): HistoryStore {
  return createHistoryStore({
    get: key => area.get(key) as Promise<Record<string, unknown>>,
    set: value => area.set(value)
  });
}

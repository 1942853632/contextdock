import { describe, expect, it } from 'vitest';
import type { ContextPack } from '../src/model';
import { createHistoryStore, type StorageAreaLike } from '../src/history';

const pack = (id: number, source = `https://x.test/${id}`): ContextPack => ({
  schemaVersion: 1, title: `P${id}`, sourceUrl: source, capturedAt: `2026-01-01T00:00:0${id}Z`, selected: false,
  sections: [`body ${id}`], tokenEstimate: 2, contentHash: `hash-${id}`,
  quality: { score: 80, characterCount: 6, sectionCount: 1, duplicateRatio: 0, headingCount: 0, codeBlockCount: 0, warnings: [] },
  redactions: { total: 0, email: 0, phone: 0, bearer: 0, jwt: 0, apiKey: 0, privateKey: 0 }
});

class FakeStorage implements StorageAreaLike {
  value: Record<string, unknown> = {};
  async get(key: string) { return { [key]: this.value[key] }; }
  async set(value: Record<string, unknown>) { this.value = { ...this.value, ...value }; }
}

describe('history store', () => {
  it('keeps newest-first history capped at twenty items', async () => {
    const store = createHistoryStore(new FakeStorage());
    for (let id = 0; id < 21; id += 1) await store.save(pack(id));
    const entries = await store.list();
    expect(entries).toHaveLength(20);
    expect(entries[0].contentHash).toBe('hash-20');
    expect(entries.at(-1)?.contentHash).toBe('hash-1');
  });

  it('updates the same source and hash instead of duplicating it', async () => {
    const store = createHistoryStore(new FakeStorage());
    await store.save(pack(1, 'https://same.test'));
    await store.save({ ...pack(2, 'https://same.test'), contentHash: 'hash-1', title: 'Updated' });
    const entries = await store.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Updated');
  });

  it('removes, clears, and recovers from malformed storage', async () => {
    const storage = new FakeStorage();
    storage.value['contextdock.history.v1'] = { invalid: true };
    const store = createHistoryStore(storage);
    expect(await store.list()).toEqual([]);
    await store.save(pack(1));
    await store.remove('hash-1');
    expect(await store.list()).toEqual([]);
    await store.save(pack(2));
    await store.clear();
    expect(await store.list()).toEqual([]);
  });
});

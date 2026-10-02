# ContextDock 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade ContextDock into a local browser context pipeline with privacy redaction, explainable quality metrics, versioned exports, and bounded local history.

**Architecture:** Keep Chrome APIs at the content, background, and side-panel edges. Build sanitization, quality analysis, hashing, packing, and serialization as pure TypeScript modules. Isolate `chrome.storage.local` behind an async `HistoryStore` adapter so all core behavior is testable under Vitest without a browser.

**Tech Stack:** TypeScript 5.6, Chrome Manifest V3, `chrome.storage.local`, Vitest 2, jsdom, pnpm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-02-context-pipeline-design.md`

## Global Constraints

- Keep all processing local; do not add an LLM, hosted API, account, telemetry, or remote analytics.
- Redact before hashing, storage, copy, and download; clearly state regex detection is not a complete security scanner.
- Store at most 20 packs, newest first, and de-duplicate by source URL plus content hash.
- Preserve existing Capture, Copy Markdown, and Export JSON workflows.
- Keep pure processing modules independent of Chrome globals.
- `pnpm test`, `pnpm lint`, and `pnpm build` must pass before publishing.

---

### Task 1: Define the versioned data model and deterministic utilities

**Files:**
- Modify: `src/model.ts`
- Test: `tests/model.test.ts`

**Interfaces:**
- `PageSnapshot` remains `{ url: string; title: string; markdown: string; selected: boolean; capturedAt: string }`.
- Add `QualityReport`, `RedactionReport`, and `ContextPack` fields from the spec.
- Export `normalizeLines(markdown: string): { lines: string[]; duplicateRatio: number }`.
- Export `stableHash(text: string): string` using a deterministic synchronous non-cryptographic hash suitable for identity, not security.
- Export `buildPack(snapshot: PageSnapshot, maxChars?: number, processed?: ProcessedContent): ContextPack`.
- Export `toMarkdown(pack: ContextPack): string` and `toJson(pack: ContextPack): string`.

- [ ] **Step 1: Write failing model tests**

Add tests asserting `schemaVersion === 1`, duplicate ratio is calculated, stable hashes match for equal normalized text, chunk limits are respected, and Markdown/JSON include source, quality, and redaction metadata.

- [ ] **Step 2: Run the focused tests**

Run `pnpm test -- tests/model.test.ts --run`. Expected: failures for the new fields and exports.

- [ ] **Step 3: Implement the model changes**

Normalize whitespace without changing fenced code content, deduplicate case-insensitively, split sections at `maxChars`, compute token estimate from normalized redacted content, and serialize fields in stable insertion order.

- [ ] **Step 4: Run model tests and typecheck**

Run `pnpm test -- tests/model.test.ts --run` and `pnpm lint`. Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add src/model.ts tests/model.test.ts
git commit -m "feat: add versioned context pack model"
```

### Task 2: Add privacy redaction and quality analysis

**Files:**
- Create: `src/sanitizer.ts`
- Create: `src/quality.ts`
- Create: `tests/sanitizer.test.ts`
- Create: `tests/quality.test.ts`
- Modify: `src/model.ts`

**Interfaces:**
- `sanitize(text: string): { text: string; report: RedactionReport }`.
- `analyzeQuality(text: string, duplicateRatio: number): QualityReport`.
- `RedactionReport` contains `total` and counts for `email`, `phone`, `bearer`, `jwt`, `apiKey`, and `privateKey`.
- Replacements are exact markers `[REDACTED_<CATEGORY>]`.

- [ ] **Step 1: Write failing sanitizer tests**

Cover one representative match for each category, two adjacent matches, overlapping bearer/JWT precedence, and the invariant that original secret text is absent from output.

- [ ] **Step 2: Run sanitizer tests to verify failure**

Run `pnpm test -- tests/sanitizer.test.ts --run`. Expected: module/export failures.

- [ ] **Step 3: Implement ordered, non-overlapping redaction**

Use named regular expressions and a single left-to-right matcher. Apply more specific token patterns before generic identifiers, replace matches with category markers, and count each replacement.

- [ ] **Step 4: Write failing quality tests**

Assert character count, heading count, fenced-code count, duplicate ratio, a zero-content warning, a low-content warning, and a missing-heading warning.

- [ ] **Step 5: Implement `analyzeQuality`**

Return deterministic numeric fields plus warning codes. Keep scoring informational and never throw for empty input.

- [ ] **Step 6: Integrate sanitizer and quality into `buildPack`**

Ensure sanitized text is the only text used for sections, token estimate, hash, and report data.

- [ ] **Step 7: Run all core tests and commit**

Run `pnpm test -- --run` and `pnpm lint`, then commit:

```powershell
git add src/model.ts src/sanitizer.ts src/quality.ts tests/model.test.ts tests/sanitizer.test.ts tests/quality.test.ts
git commit -m "feat: redact sensitive values and score captures"
```

### Task 3: Add bounded local history storage

**Files:**
- Create: `src/history.ts`
- Create: `tests/history.test.ts`

**Interfaces:**
- `StorageAreaLike` exposes `get(key: string): Promise<Record<string, unknown>>` and `set(value: Record<string, unknown>): Promise<void>`.
- `HistoryStore` exposes `list(): Promise<ContextPack[]>`, `save(pack: ContextPack): Promise<void>`, `remove(contentHash: string): Promise<void>`, and `clear(): Promise<void>`.
- Export `createChromeHistoryStore(area: chrome.storage.StorageArea): HistoryStore`.
- Storage key is `contextdock.history.v1`.

- [ ] **Step 1: Write fake-storage tests**

Test newest-first ordering, maximum 20 entries, update-on-same-source-and-hash, removal, clear, and recovery from malformed/empty storage.

- [ ] **Step 2: Run history tests to verify failure**

Run `pnpm test -- tests/history.test.ts --run`. Expected: module/export failures.

- [ ] **Step 3: Implement the adapter**

Read and validate arrays, save a de-duplicated list capped with `.slice(0, 20)`, and never expose the mutable internal array to callers.

- [ ] **Step 4: Run history tests and typecheck**

Run `pnpm test -- tests/history.test.ts --run` and `pnpm lint`. Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add src/history.ts tests/history.test.ts
git commit -m "feat: persist bounded local context history"
```

### Task 4: Integrate the pipeline into the side panel

**Files:**
- Modify: `src/sidepanel.html`
- Modify: `src/sidepanel.css`
- Modify: `src/sidepanel.ts`
- Modify: `manifest.json`

**Interfaces:**
- Side panel uses `createChromeHistoryStore(chrome.storage.local)`.
- Capture calls `buildPack(snapshot, maxChars)` then saves the resulting pack.
- UI render functions consume only `ContextPack` data and never raw page content.

- [ ] **Step 1: Add stable UI elements**

Add quality, warnings, redaction count, and history containers with stable IDs; add restore/delete/clear controls while keeping existing capture, copy, and download buttons.

- [ ] **Step 2: Implement render and history event handlers**

Load history at startup, render newest first, restore selected packs into the preview, remove one entry, and clear all entries. Show actionable errors in the existing status element.

- [ ] **Step 3: Wire capture to save sanitized packs**

After capture, render the pack, save it, refresh history, and show whether the source was a selection or readable-page fallback.

- [ ] **Step 4: Update styles and permissions**

Keep the compact side-panel layout, make history scrollable, and ensure `storage` remains declared in the manifest.

- [ ] **Step 5: Build and inspect generated assets**

Run `pnpm build`; verify `dist/sidepanel.html`, `dist/sidepanel.js`, and all new compiled modules exist.

- [ ] **Step 6: Commit**

```powershell
git add src/sidepanel.html src/sidepanel.css src/sidepanel.ts manifest.json
git commit -m "feat: add quality and local history to side panel"
```

### Task 5: Documentation, CI, and release verification

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/demo-checklist.md`

- [ ] **Step 1: Document the data contract and privacy limits**

Explain schema version 1, redaction categories, local-only processing, the non-security-guarantee disclaimer, history controls, and the manual fake-secret demo.

- [ ] **Step 2: Add architecture and interview sections**

Include the pipeline diagram, module boundaries, failure handling, deterministic test strategy, and a concise interview narrative.

- [ ] **Step 3: Add the manual demo checklist**

Document loading `dist/`, capturing a documentation page with a deliberately fake email/token, checking that the preview and export contain only markers, restoring from history, and deleting the record.

- [ ] **Step 4: Verify CI commands**

Ensure the workflow runs `pnpm install --frozen-lockfile`, `pnpm test -- --run`, `pnpm lint`, and `pnpm build` on a supported Node version.

- [ ] **Step 5: Run the complete local gate**

Run `pnpm test -- --run`, `pnpm lint`, and `pnpm build`. Expected: all tests pass, no TypeScript errors, and `dist/` is generated.

- [ ] **Step 6: Commit and publish**

```powershell
git add README.md .github/workflows/ci.yml docs/demo-checklist.md
git commit -m "docs: explain context pipeline and verification"
.\publish.ps1
```

Confirm `git status --branch` is clean and `origin/main` points at the release commit.

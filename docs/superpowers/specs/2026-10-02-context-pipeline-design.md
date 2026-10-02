# ContextDock 1.0: Local Browser Context Pipeline

## Goal

Turn ContextDock from a page-to-Markdown copier into a deterministic, local-only browser data pipeline for preparing web context for agent workflows. The extension must make extraction quality, privacy handling, and output provenance visible without requiring a paid model or hosted backend.

## Scope

### In scope

- Extract readable page content or the current text selection.
- Normalize and deduplicate content before chunking.
- Detect and redact common secrets and personal identifiers before export.
- Calculate deterministic quality metrics for each capture.
- Persist the latest 20 packs in `chrome.storage.local`.
- Export a versioned JSON document and cited Markdown.
- Keep core processing as pure TypeScript functions with unit tests.

### Out of scope

- Calling an LLM or uploading page content.
- Accounts, cloud sync, remote analytics, or a hosted API.
- Full PDF, YouTube, or GitHub API adapters in this iteration.
- Claiming that regex-based detection is a complete security scanner.

## Architecture

```text
content script
  -> PageSnapshot
  -> sanitizer (redaction)
  -> model (normalize, deduplicate, chunk, hash)
  -> quality (metrics and warnings)
  -> ContextPack v1
  -> storage adapter / exporters / side panel UI
```

The content script remains a thin Chrome adapter. `sanitizer.ts`, `quality.ts`, and the extended `model.ts` contain pure functions and do not access Chrome APIs. `history.ts` is the only storage boundary; it accepts a small async storage interface so tests do not need a browser runtime.

## Data contract

`ContextPack` is versioned with `schemaVersion: 1` and contains:

- title, source URL, capture time, and whether the input was a selection;
- ordered sections and token estimate;
- `contentHash`, generated from the normalized redacted text;
- `quality`: character count, section count, duplicate ratio, heading count, code block count, and warnings;
- `redactions`: count and category counts for each replacement type.

The exported JSON is stable for the same input, except for the capture timestamp. Markdown includes the source URL, timestamp, quality summary, and the redacted sections.

## Privacy behavior

Redaction runs before hashing, storage, copy, and download. It recognizes common patterns for email addresses, phone numbers, bearer tokens, JWTs, API keys, and private-key headers. Replacements use category markers such as `[REDACTED_EMAIL]`. The UI displays the number of replacements and never displays the original match after processing.

This is a convenience safeguard, not a security guarantee; the README will state that limitation and recommend reviewing output before sharing.

## Quality metrics

The quality score is deterministic and explainable. It reports:

- normalized character count;
- number of sections and headings;
- code-block count;
- duplicate ratio removed during normalization;
- warning codes for empty content, low content density, and missing headings.

The score is informational and must not block export.

## History behavior

The extension stores at most 20 packs, newest first, under one versioned storage key. Saving a pack with the same `contentHash` and source URL updates its timestamp instead of creating an unbounded duplicate. The side panel can restore a saved pack or delete individual entries and clear all history.

## UI changes

- Show quality score, warning count, token estimate, and redaction count beside the current capture.
- Add a compact history list with restore and delete actions.
- Keep existing Capture, Copy Markdown, and Export JSON actions.
- Preserve the local-only status and explain that processing happens in the browser.

## Testing and verification

- Unit tests for every redaction category, overlapping matches, quality warnings, stable hashing, chunk boundaries, and history CRUD using a fake storage adapter.
- Existing extractor and model tests remain green.
- `pnpm test`, `pnpm lint`, and `pnpm build` must pass.
- GitHub Actions runs the same test and build commands.
- Manual verification loads `dist/` as an unpacked extension, captures a documentation page containing a deliberately fake token, confirms the token is absent from preview/export, restores the pack from history, and deletes it.

## Interview narrative

The project demonstrates a browser-side ETL pipeline with explicit boundaries: acquisition, normalization, privacy filtering, quality observability, versioned data contracts, persistence, and deterministic exports. It is intentionally local-only, so a demo does not require API keys or paid inference.

# ContextDock

ContextDock is a local-only Chrome Manifest V3 extension that turns the active webpage or selected text into a clean, cited and privacy-filtered context pack for ChatGPT, Claude, Copilot, and other agent workflows.

## Interview-ready engineering story

ContextDock is a browser data pipeline, not a prompt box: capture, normalize, redact, score, chunk, persist and export are explicit stages with deterministic outputs. That makes the project easy to demo and gives a concrete discussion surface for ETL, privacy and agent context-window design.

## Why this project

Copying a whole webpage into an AI tool creates noise, loses the source URL, duplicates navigation, and makes prompts hard to reproduce. ContextDock treats web context as a local data pipeline:

```text
capture -> extract -> normalize -> redact -> score -> chunk -> persist -> export
```

The extension does not call a model or upload page content, so it has no API cost and is safe to demo with private pages.

## Features

- Chrome side panel with one-click capture
- Selection-first capture, with readable-page fallback
- DOM extraction for headings, paragraphs, lists, code and blockquotes
- Removes scripts, navigation, forms, SVG and hidden content
- Deterministic deduplication and configurable chunk size
- Source URL, timestamp, content hash and token estimate included in every pack
- Explainable quality score: content size, headings, code blocks, duplicate ratio and warnings
- Redacts common emails, phone numbers, bearer tokens, JWTs, API keys and private-key blocks before storage/export
- Saves the newest 20 packs locally with restore, delete and clear-history controls

## Repository map

- `src/pipeline.ts`: pure context transformation pipeline
- `src/content.ts`: selection and readable-page adapter
- `src/sidepanel.ts`: history, scoring and export UI
- `tests/`: pipeline and redaction regressions
- Versioned JSON (`schemaVersion: 1`) and cited Markdown exports

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

The core modules are deliberately separated from Chrome APIs:

- `src/extractor.ts`: DOM extraction and readable-page fallback
- `src/sanitizer.ts`: deterministic, category-counted redaction
- `src/quality.ts`: explainable quality metrics and warning codes
- `src/model.ts`: normalization, chunking, stable identity hash and exports
- `src/history.ts`: `chrome.storage.local` adapter with a 20-pack bound
- `src/sidepanel.ts`: thin UI and browser integration layer

## Data contract and privacy

Each exported pack uses `schemaVersion: 1` and includes source metadata, ordered sections, a content hash, quality metrics and redaction counts. Redaction happens before hashing, local persistence, clipboard copy and download. The patterns are convenience safeguards, not a complete security scanner; review a pack before sharing it. No raw page content is sent to a server.

## Interview-ready engineering points

- **ETL boundary:** acquisition, normalization, privacy filtering, quality observability, bounded persistence and deterministic export are separate modules.
- **Reproducibility:** equal normalized input produces the same content hash and pack structure; tests cover chunk limits and duplicate handling.
- **Failure handling:** malformed history is treated as empty, export never depends on a network call, and quality warnings do not block capture.
- **Security posture:** no credentials or model API keys are required; sensitive-looking values are replaced before any user-visible output.

See [`docs/demo-checklist.md`](docs/demo-checklist.md) for a repeatable manual demo.

### Publish to GitHub on Windows

If Git reports `SEC_E_NO_CREDENTIALS` or Git Credential Manager cannot use Windows Credential Manager, run:

```powershell
.\publish.ps1
```

The script uses Git's OpenSSL TLS backend and a project-local credential store. It never contains a token. For a fresh machine, authenticate with Git Credential Manager (`git-credential-manager github login`) or use the GitHub web upload flow. See [GitHub authentication](https://docs.github.com/en/get-started/git-basics/set-up-git#authenticating-on-the-command-line), [Git Credential Manager credential stores](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/credstores.md), and [Git http.sslBackend](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httpsslBackend).

Load `dist/` from `chrome://extensions` with Developer mode -> Load unpacked. Open the side panel, visit a documentation page, and click Capture.

## Engineering notes

The extraction, sanitization, quality and packing layers are pure functions with tests, while Chrome APIs are isolated to thin content/background/UI adapters. This keeps browser integration replaceable and makes core behavior reproducible. Future iterations can add PDF/YouTube/GitHub adapters or an MCP `context://` exporter without introducing a hosted backend.

## License

MIT

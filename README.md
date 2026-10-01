# ContextDock

ContextDock is a local-only Chrome Manifest V3 extension that turns the active webpage or selected text into a clean, cited context pack for ChatGPT, Claude, Copilot, and other agent workflows.

## Why this project

Copying a whole webpage into an AI tool creates noise, loses the source URL, duplicates navigation, and makes prompts hard to reproduce. ContextDock treats web context as data: extract, normalize, deduplicate, chunk, estimate size, then export. The extension does not call a model or upload page content, so it has no API cost and is safe to demo with private pages.

## Features

- Chrome side panel with one-click capture
- Selection-first capture, with readable-page fallback
- DOM extraction for headings, paragraphs, lists, code and blockquotes
- Removes scripts, navigation, forms, SVG and hidden content
- Deterministic deduplication and configurable chunk size
- Source URL, timestamp and token estimate included in every pack
- Copy Markdown or export JSON; all processing stays in the browser

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

Load `dist/` from `chrome://extensions` with Developer mode -> Load unpacked. Open the side panel, visit a documentation page, and click Capture.

## Engineering notes

The extraction and packing layers are pure functions with tests, while Chrome APIs are isolated to thin content/background/UI adapters. This keeps browser integration replaceable and makes core behavior reproducible. Future iterations can add PDF/YouTube/GitHub adapters, local IndexedDB history, configurable redaction rules, and an MCP `context://` exporter without introducing a hosted backend.

## License

MIT

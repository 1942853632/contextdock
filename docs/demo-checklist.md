# ContextDock Manual Demo

## Load the extension

1. Run `pnpm build`.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select the repository's `dist/` directory.
4. Open the ContextDock side panel from the extension action.

## Verify the local pipeline

1. Open a documentation page with headings, paragraphs and a code block.
2. Add a temporary visible string such as `demo@example.com` and `Bearer demo_token_1234567890` to a local test page, or select equivalent text on a page you control.
3. Click **Capture**.
4. Confirm the preview contains `[REDACTED_EMAIL]` and `[REDACTED_BEARER]`, not the original values.
5. Confirm the panel shows sections, token estimate, quality score, warning count and redaction count.
6. Click **Export JSON** and inspect that the file contains `schemaVersion: 1`, `contentHash`, `quality`, and `redactions`.
7. Close and reopen the side panel. Restore the pack from **Recent packs**.
8. Delete the restored entry, then use **Clear** and confirm the list is empty.

## Automated gate

```bash
pnpm test -- --run
pnpm lint
pnpm build
```

The redaction rules are intentionally conservative convenience safeguards. Do not use the demo as proof that arbitrary secrets are detected.

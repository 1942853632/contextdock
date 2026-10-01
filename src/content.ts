import { extractMarkdown } from './extractor';
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => { if (message.type !== 'capture') return; const selection = window.getSelection()?.toString().trim(); sendResponse({ url: location.href, title: document.title, markdown: selection || extractMarkdown(), selected: Boolean(selection), capturedAt: new Date().toISOString() }); });

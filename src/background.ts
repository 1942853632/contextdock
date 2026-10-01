chrome.runtime.onInstalled.addListener(() => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }));
chrome.commands.onCommand.addListener(async command => { if (command === 'open-contextdock') { const id = (await chrome.windows.getCurrent()).id; if (id !== undefined) await chrome.sidePanel.open({ windowId: id }); } });

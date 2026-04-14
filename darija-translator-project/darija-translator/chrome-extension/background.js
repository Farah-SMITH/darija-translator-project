// background.js – Service Worker (Manifest V3)

// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "darija-translate",
    title: "Translate to Darija",
    contexts: ["selection"]
  });
  console.log("Darija Translator extension installed.");
});

// When user right-clicks selected text → open side panel with text
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "darija-translate" && info.selectionText) {
    // Store the selected text so the side panel can read it
    await chrome.storage.session.set({ pendingText: info.selectionText });

    // Open the side panel for this tab
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Also open side panel when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

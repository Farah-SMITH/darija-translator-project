// content.js – injected into every page
// Listens for messages from the side panel requesting selected text

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ selectedText });
  }
  return true; // keep message channel open
});

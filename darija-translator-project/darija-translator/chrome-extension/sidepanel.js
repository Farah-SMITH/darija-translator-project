// sidepanel.js

const DEFAULT_SERVER = "http://localhost:8080/darija-translator/api/translate";

// ── DOM refs ──────────────────────────────────────────────────────────────
const serverUrlEl   = document.getElementById("serverUrl");
const usernameEl    = document.getElementById("username");
const passwordEl    = document.getElementById("password");
const sourceTextEl  = document.getElementById("sourceText");
const sourceLangEl  = document.getElementById("sourceLanguage");
const resultEl      = document.getElementById("translationResult");
const statusBox     = document.getElementById("statusBox");
const btnTranslate  = document.getElementById("btnTranslate");
const btnGrab       = document.getElementById("btnGrab");
const btnSpeak      = document.getElementById("btnSpeak");
const btnClear      = document.getElementById("btnClear");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const toggleSettings  = document.getElementById("toggleSettings");
const settingsPanel   = document.getElementById("settingsPanel");

// ── Init: load saved settings ─────────────────────────────────────────────
chrome.storage.sync.get(["serverUrl", "username", "password"], (data) => {
  serverUrlEl.value = data.serverUrl || DEFAULT_SERVER;
  usernameEl.value  = data.username  || "admin";
  passwordEl.value  = data.password  || "";
});

// Auto-fill if background pushed a pending text (via context menu)
chrome.storage.session.get("pendingText", ({ pendingText }) => {
  if (pendingText) {
    sourceTextEl.value = pendingText;
    chrome.storage.session.remove("pendingText");
  }
});

// ── Settings toggle ───────────────────────────────────────────────────────
toggleSettings.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
});

btnSaveSettings.addEventListener("click", () => {
  chrome.storage.sync.set({
    serverUrl: serverUrlEl.value.trim(),
    username:  usernameEl.value.trim(),
    password:  passwordEl.value
  });
  showStatus("Settings saved ✓", "success");
});

// ── Grab selected text from active tab ───────────────────────────────────
btnGrab.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });
    const text = results?.[0]?.result;
    if (text) {
      sourceTextEl.value = text;
      showStatus("Text grabbed from page ✓", "success");
    } else {
      showStatus("No text selected on the page.", "error");
    }
  } catch (e) {
    showStatus("Could not access page text: " + e.message, "error");
  }
});

// ── Translate ─────────────────────────────────────────────────────────────
btnTranslate.addEventListener("click", translate);

async function translate() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    showStatus("Please enter some text to translate.", "error");
    return;
  }

  const serverUrl = serverUrlEl.value.trim() || DEFAULT_SERVER;
  const username  = usernameEl.value.trim();
  const password  = passwordEl.value;

  // Basic Auth header
  const credentials = btoa(`${username}:${password}`);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${credentials}`
  };

  const body = JSON.stringify({
    text: text,
    sourceLanguage: sourceLangEl.value
  });

  btnTranslate.disabled = true;
  showStatus("Translating…", "loading");

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers,
      body
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      showStatus("Error: " + (data.errorMessage || response.statusText), "error");
      return;
    }

    resultEl.value = data.translatedText || "";
    showStatus("Translation complete ✓", "success");

  } catch (err) {
    showStatus("Network error: " + err.message, "error");
  } finally {
    btnTranslate.disabled = false;
  }
}

// ── Text-to-speech (Read Aloud) ───────────────────────────────────────────
btnSpeak.addEventListener("click", () => {
  const text = resultEl.value.trim();
  if (!text) {
    showStatus("Nothing to read aloud.", "error");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-MA"; // Moroccan Arabic
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});

// ── Clear ──────────────────────────────────────────────────────────────────
btnClear.addEventListener("click", () => {
  sourceTextEl.value = "";
  resultEl.value = "";
  hideStatus();
  window.speechSynthesis.cancel();
});

// ── Helpers ───────────────────────────────────────────────────────────────
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function hideStatus() {
  statusBox.className = "status hidden";
}

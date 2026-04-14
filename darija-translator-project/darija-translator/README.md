# 🇲🇦 Darija Translator – LLM-Powered RESTful Web Service

A Jakarta EE REST service that translates text into Moroccan Arabic Dialect (Darija) using Google Gemini 1.5 Flash, plus a Chrome Extension, PHP client, Python client, and React Native mobile app.

---

## 📁 Project Structure

```
darija-translator/
├── rest-service/            ← Maven WAR project (Jakarta EE)
│   ├── pom.xml
│   └── src/main/
│       ├── java/ma/translator/
│       │   ├── TranslatorApplication.java
│       │   ├── resource/TranslatorResource.java
│       │   ├── service/GeminiTranslatorService.java
│       │   ├── model/TranslationRequest.java
│       │   ├── model/TranslationResponse.java
│       │   └── auth/CORSFilter.java
│       └── webapp/WEB-INF/
│           ├── web.xml
│           ├── payara-web.xml
│           └── beans.xml
│
├── chrome-extension/        ← Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── icons/              ← Add icon16.png, icon48.png, icon128.png
│
├── php-client/
│   └── index.php
│
├── python-client/
│   └── translator_client.py
│
└── react-native-client/    ← Expo / React Native app
    ├── App.js
    └── package.json
```

---

## 🔑 Step 0 – Get a FREE Gemini API Key

1. Go to https://ai.google.dev/pricing#1_5flash
2. Click **"Get API key in Google AI Studio"**
3. Create or select a Google Cloud project → click **"Create API key"**
4. Copy the key – you'll need it in Step 2

---

## 🖥️ Part 1 – REST Service (Maven + Payara)

### Prerequisites
- Java 17+
- Maven 3.8+
- Payara Server 6 (Community) — download from https://www.payara.fish/downloads/

### 1. Build the WAR
```bash
cd rest-service
mvn clean package
# Output: target/darija-translator.war
```

### 2. Set the API Key environment variable

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY = "YOUR_KEY_HERE"
```

**macOS / Linux:**
```bash
export GEMINI_API_KEY="YOUR_KEY_HERE"
```

### 3a. Deploy to Payara Server

```bash
# Start Payara
$PAYARA_HOME/bin/asadmin start-domain

# Create a user in the file realm
$PAYARA_HOME/bin/asadmin create-file-user \
  --groups translator-user \
  --passwordfile /tmp/passfile \
  admin
# (create /tmp/passfile containing: AS_ADMIN_USERPASSWORD=admin123)

# Deploy the WAR
$PAYARA_HOME/bin/asadmin deploy target/darija-translator.war
```

### 3b. OR – Run with Payara Micro (easier, no install needed)
```bash
mvn payara-micro:start
```
This downloads Payara Micro automatically and runs on port 8080.

> **Windows note:** Set GEMINI_API_KEY before running Maven.

### 4. Test with cURL
```bash
# Health check (no auth)
curl http://localhost:8080/darija-translator/api/translate/health

# Translate (Basic Auth: admin / admin123)
curl -X POST http://localhost:8080/darija-translator/api/translate \
  -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d '{"text":"Hello, how are you?","sourceLanguage":"English"}'

# GET style
curl "http://localhost:8080/darija-translator/api/translate?text=Hello&sourceLanguage=English" \
  -u admin:admin123
```

### 5. Test with Postman
- **Method:** POST
- **URL:** `http://localhost:8080/darija-translator/api/translate`
- **Auth:** Basic Auth → Username: `admin` / Password: `admin123`
- **Body (JSON):**
  ```json
  { "text": "Good morning!", "sourceLanguage": "English" }
  ```

### REST Endpoints Summary

| Method | Path                              | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| POST   | `/api/translate`                  | Required | Translate JSON body      |
| GET    | `/api/translate?text=...&sourceLanguage=...` | Required | Quick translate |
| GET    | `/api/translate/health`           | None     | Service health check     |

---

## 🌐 Part 2 – Chrome Extension

### Install
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `chrome-extension/` folder

> **Icons:** Add `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`  
> (Any simple 🇲🇦 flag or "D" icon works — use https://favicon.io to generate)

### Use
- **Right-click** any selected text on a webpage → **"Translate to Darija"**
- OR click the extension icon in the toolbar
- First time: expand **⚙️ Settings** and fill in your server URL + credentials

---

## 🐘 Part 3 – PHP Client

### Prerequisites
- PHP 7.4+ with `curl` extension
- Edit the constants at the top of `index.php` if your server/credentials differ

### Run
```bash
cd php-client
php -S localhost:8000
# Open http://localhost:8000 in your browser
```

---

## 🐍 Part 4 – Python Client

### Prerequisites
```bash
pip install requests
```

### CLI mode
```bash
cd python-client
python translator_client.py --text "Hello!" --lang English
```

### Interactive GUI (tkinter)
```bash
python translator_client.py --gui
```

### Options
```
--text       Text to translate
--lang       Source language (default: English)
--url        REST URL (default: http://localhost:8080/...)
--username   Basic auth username (default: admin)
--password   Basic auth password (default: admin123)
--gui        Launch Tkinter GUI
```

---

## 📱 Part 5 – React Native (Expo)

### Prerequisites
```bash
npm install -g expo-cli
cd react-native-client
npm install
```

### Run
```bash
# Start Expo dev server
npx expo start

# Then press:
#   a → Android emulator
#   i → iOS simulator
#   w → Web browser
#   Scan QR → Expo Go app on your phone
```

> **Android Emulator note:** The default URL uses `10.0.2.2` which routes to your PC's localhost.  
> **Physical device:** Change the URL in Settings to your PC's local IP (e.g., `http://192.168.1.x:8080/...`)

### Features
- Language selector chips
- RTL Arabic output display
- 🔊 Text-to-speech (Read Aloud)
- 📋 Copy translation to clipboard
- Persistent settings via AsyncStorage

---

## 🔒 Security Notes

- Basic Authentication is enabled on `/api/translate`
- Use HTTPS in production (change `<transport-guarantee>` to `CONFIDENTIAL` in web.xml)
- Never commit your `GEMINI_API_KEY` — always use environment variables
- Change default credentials (`admin/admin123`) before any deployment

---

## 🛠️ VS Code Tips

1. Install the **Extension Pack for Java** (Microsoft)
2. Install the **Payara Tools** VS Code extension for one-click deploy
3. Use the **REST Client** extension to test endpoints directly from `.http` files

---

## 🧪 Quick Smoke Test (all in one)

```bash
# 1. Start the server (Payara Micro)
cd rest-service && export GEMINI_API_KEY="YOUR_KEY" && mvn payara-micro:start &

# 2. Wait ~15s then test
curl -s -u admin:admin123 \
  -H "Content-Type: application/json" \
  -X POST http://localhost:8080/darija-translator/api/translate \
  -d '{"text":"Hello","sourceLanguage":"English"}' | python3 -m json.tool
```

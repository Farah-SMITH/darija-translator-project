<?php
// ============================================================
// Darija Translator – PHP Client
// ============================================================
// Requirements: PHP 7.4+ with curl extension enabled
// Usage: run with `php -S localhost:8000` then open in browser
// ============================================================

// ── Configuration ────────────────────────────────────────────
define('REST_URL',  'http://localhost:8080/darija-translator/api/translate');
define('USERNAME',  'admin');
define('PASSWORD',  'admin123');

// ── Handle form submission ────────────────────────────────────
$translation   = null;
$errorMessage  = null;
$inputText     = '';
$sourceLang    = 'English';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputText  = trim($_POST['text']      ?? '');
    $sourceLang = trim($_POST['sourceLang'] ?? 'English');

    if ($inputText === '') {
        $errorMessage = 'Please enter some text.';
    } else {
        $result = callTranslatorApi($inputText, $sourceLang);
        if ($result['success']) {
            $translation = $result['translatedText'];
        } else {
            $errorMessage = $result['error'];
        }
    }
}

// ── REST API call function ────────────────────────────────────
function callTranslatorApi(string $text, string $sourceLang): array {
    $payload = json_encode([
        'text'           => $text,
        'sourceLanguage' => $sourceLang,
    ]);

    $ch = curl_init(REST_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_USERPWD        => USERNAME . ':' . PASSWORD,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response   = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError  = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'error' => 'cURL error: ' . $curlError];
    }

    $data = json_decode($response, true);

    if ($httpStatus !== 200 || ($data['status'] ?? '') === 'error') {
        return ['success' => false, 'error' => $data['errorMessage'] ?? "HTTP $httpStatus"];
    }

    return ['success' => true, 'translatedText' => $data['translatedText']];
}

// ── HTML output ───────────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Darija Translator – PHP Client</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f4f8;
         display: flex; justify-content: center; align-items: flex-start;
         min-height: 100vh; padding: 40px 16px; }
  .container { width: 100%; max-width: 680px; }
  header { background: linear-gradient(135deg, #2d6a4f, #40916c); color: #fff;
           border-radius: 14px; padding: 24px 28px; margin-bottom: 24px; }
  header h1 { font-size: 1.5rem; margin-bottom: 4px; }
  header p  { font-size: 0.9rem; opacity: 0.85; }
  .card { background: #fff; border-radius: 14px; padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 20px; }
  label { display:block; font-size: 0.82rem; font-weight: 700;
          text-transform: uppercase; letter-spacing:.04em;
          color: #4a5568; margin-bottom: 8px; }
  textarea, select { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px;
                     padding: 12px; font-size: 1rem; font-family: inherit;
                     transition: border-color .2s; }
  textarea:focus, select:focus { outline: none; border-color: #40916c; }
  #inputText    { min-height: 120px; resize: vertical; }
  #resultArea   { min-height: 120px; direction: rtl; font-size: 1.15rem;
                  line-height: 1.7; background: #f7faf9; resize: vertical; }
  .controls { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
  button { background: #2d6a4f; color: #fff; border: none; border-radius: 8px;
           padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer; }
  button:hover { background: #40916c; }
  .alert { padding: 12px 16px; border-radius: 8px; margin-top: 16px; font-size: .9rem; }
  .alert-error   { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
  .alert-success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
  .badge { display:inline-block; background:#ebf8ff; color:#2b6cb0;
           font-size:.75rem; font-weight:700; padding:2px 8px; border-radius:99px; margin-left:8px; }
</style>
</head>
<body>
<div class="container">

  <header>
    <h1>🇲🇦 Darija Translator <span class="badge">PHP Client</span></h1>
    <p>Translates text into Moroccan Arabic Dialect via Jakarta REST Service</p>
  </header>

  <div class="card">
    <form method="POST" action="">
      <label for="sourceLang">Source Language</label>
      <select id="sourceLang" name="sourceLang">
        <?php
        $langs = ['English','French','Spanish','Arabic (Modern Standard)','German','Italian'];
        foreach ($langs as $l) {
            $sel = ($l === $sourceLang) ? 'selected' : '';
            echo "<option value=\"$l\" $sel>$l</option>";
        }
        ?>
      </select>
      <br><br>

      <label for="text">Text to Translate</label>
      <textarea id="inputText" name="text" placeholder="Enter text here…"><?php
        echo htmlspecialchars($inputText);
      ?></textarea>

      <div class="controls">
        <button type="submit">Translate to Darija ➜</button>
      </div>

      <?php if ($errorMessage): ?>
        <div class="alert alert-error">⚠️ <?php echo htmlspecialchars($errorMessage); ?></div>
      <?php endif; ?>
    </form>
  </div>

  <?php if ($translation !== null): ?>
  <div class="card">
    <label>Darija Translation (دارجة)</label>
    <textarea id="resultArea" readonly><?php echo htmlspecialchars($translation); ?></textarea>
    <div class="controls">
      <button onclick="speakDarija()">🔊 Read Aloud</button>
    </div>
    <div class="alert alert-success">✓ Translation successful</div>
  </div>
  <script>
    function speakDarija() {
      const text = document.getElementById('resultArea').value;
      if (!text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-MA';
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  </script>
  <?php endif; ?>

</div>
</body>
</html>

package ma.translator.model;

/**
 * Response body returned by the translate endpoint.
 */
public class TranslationResponse {
    private String originalText;
    private String translatedText;
    private String sourceLanguage;
    private String targetLanguage = "Darija (Moroccan Arabic)";
    private String status;
    private String errorMessage;

    public TranslationResponse() {}

    // Success factory
    public static TranslationResponse success(String original, String translated, String sourceLang) {
        TranslationResponse r = new TranslationResponse();
        r.originalText = original;
        r.translatedText = translated;
        r.sourceLanguage = sourceLang;
        r.status = "success";
        return r;
    }

    // Error factory
    public static TranslationResponse error(String message) {
        TranslationResponse r = new TranslationResponse();
        r.status = "error";
        r.errorMessage = message;
        return r;
    }

    // Getters & Setters
    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getTranslatedText() { return translatedText; }
    public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

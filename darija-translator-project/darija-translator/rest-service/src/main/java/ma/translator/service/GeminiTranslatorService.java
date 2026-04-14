package ma.translator.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * CDI bean that calls Google Gemini 1.5 Flash API to translate text into Darija.
 *
 * Set the environment variable GEMINI_API_KEY before running the server.
 * Get a free key at: https://ai.google.dev/pricing#1_5flash
 */
@ApplicationScoped
public class GeminiTranslatorService {

    private static final Logger LOG = Logger.getLogger(GeminiTranslatorService.class.getName());

    // Read API key from environment variable (never hard-code secrets!)
    private static final String API_KEY = System.getenv("AIzaSyAWySAOdsTbhytiM_4_kLCIa4HDQ2i_L_w");

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final Gson gson = new Gson();

    /**
     * Translate {@code text} from {@code sourceLanguage} into Moroccan Darija.
     *
     * @param text           the text to translate
     * @param sourceLanguage the source language name (e.g. "English")
     * @return the Darija translation
     * @throws TranslationException if the API call fails
     */
    public String translate(String text, String sourceLanguage) throws TranslationException {

        if (API_KEY == null || API_KEY.isBlank()) {
            throw new TranslationException(
                "GEMINI_API_KEY environment variable is not set. " +
                "Get a free key at https://ai.google.dev/pricing#1_5flash");
        }

        String prompt = buildPrompt(text, sourceLanguage);
        String requestBody = buildRequestBody(prompt);

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpPost post = new HttpPost(GEMINI_URL + API_KEY);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(requestBody, ContentType.APPLICATION_JSON));

            return httpClient.execute(post, response -> {
                int statusCode = response.getCode();
                String responseBody = EntityUtils.toString(response.getEntity());

                if (statusCode != 200) {
                    LOG.log(Level.WARNING, "Gemini API error {0}: {1}", new Object[]{statusCode, responseBody});
                    throw new IOException("Gemini API returned HTTP " + statusCode + ": " + responseBody);
                }

                return extractTranslation(responseBody);
            });

        } catch (IOException e) {
            LOG.log(Level.SEVERE, "Failed to call Gemini API", e);
            throw new TranslationException("Translation service unavailable: " + e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String buildPrompt(String text, String sourceLanguage) {
        return String.format(
            "You are an expert translator specializing in Moroccan Arabic Dialect (Darija). " +
            "Translate the following %s text into Moroccan Darija. " +
            "Use Arabic script for the output. " +
            "Provide ONLY the translation, no explanations or extra text.\n\n" +
            "Text to translate: %s",
            sourceLanguage, text
        );
    }

    private String buildRequestBody(String prompt) {
        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);

        JsonArray parts = new JsonArray();
        parts.add(textPart);

        JsonObject content = new JsonObject();
        content.add("parts", parts);

        JsonArray contents = new JsonArray();
        contents.add(content);

        JsonObject body = new JsonObject();
        body.add("contents", contents);

        // Optional: tune safety / generation settings
        JsonObject genConfig = new JsonObject();
        genConfig.addProperty("temperature", 0.3);
        genConfig.addProperty("maxOutputTokens", 1024);
        body.add("generationConfig", genConfig);

        return gson.toJson(body);
    }

    private String extractTranslation(String responseBody) throws IOException {
        try {
            JsonObject json = gson.fromJson(responseBody, JsonObject.class);
            return json
                .getAsJsonArray("candidates")
                .get(0).getAsJsonObject()
                .getAsJsonObject("content")
                .getAsJsonArray("parts")
                .get(0).getAsJsonObject()
                .get("text").getAsString()
                .trim();
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Unexpected Gemini response format: " + responseBody, e);
            throw new IOException("Could not parse Gemini response: " + responseBody);
        }
    }

    // -------------------------------------------------------------------------
    // Checked exception for translation errors
    // -------------------------------------------------------------------------
    public static class TranslationException extends Exception {
        public TranslationException(String message) { super(message); }
        public TranslationException(String message, Throwable cause) { super(message, cause); }
    }
}

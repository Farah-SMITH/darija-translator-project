package ma.translator.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ma.translator.model.TranslationRequest;
import ma.translator.model.TranslationResponse;
import ma.translator.service.GeminiTranslatorService;
import ma.translator.service.GeminiTranslatorService.TranslationException;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * JAX-RS resource: TranslatorResource
 *
 * Endpoints:
 *   POST /api/translate          – translate a JSON body
 *   GET  /api/translate?text=... – quick GET (for testing / extensions)
 *   GET  /api/translate/health   – health check (unauthenticated)
 *
 * Authentication: HTTP Basic Auth (configured in web.xml + payara-web.xml)
 * Role required : translator-user
 */
@Path("/translate")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TranslatorResource {

    private static final Logger LOG = Logger.getLogger(TranslatorResource.class.getName());

    @Inject
    private GeminiTranslatorService translatorService;

    // ------------------------------------------------------------------
    // POST /api/translate
    // Body: { "text": "Hello", "sourceLanguage": "English" }
    // ------------------------------------------------------------------
    @POST
    @PermitAll
    public Response translate(TranslationRequest request) {

        if (request == null || request.getText() == null || request.getText().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(TranslationResponse.error("Request body must contain a non-empty 'text' field."))
                    .build();
        }

        String sourceLang = request.getSourceLanguage() != null
                ? request.getSourceLanguage()
                : "English";

        return doTranslate(request.getText().trim(), sourceLang);
    }

    // ------------------------------------------------------------------
    // GET /api/translate?text=Hello&sourceLanguage=English
    // Handy for browser / curl / Chrome extension quick calls
    // ------------------------------------------------------------------
    @GET
    @PermitAll
    public Response translateGet(
            @QueryParam("text") @NotBlank String text,
            @QueryParam("sourceLanguage") @DefaultValue("English") String sourceLanguage) {

        if (text == null || text.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(TranslationResponse.error("Query parameter 'text' is required and must not be empty."))
                    .build();
        }

        return doTranslate(text.trim(), sourceLanguage);
    }

    // ------------------------------------------------------------------
    // GET /api/translate/health  – no auth required
    // ------------------------------------------------------------------
    @GET
    @Path("/health")
    @PermitAll
    public Response health() {
        return Response.ok("{\"status\":\"UP\",\"service\":\"Darija Translator\"}").build();
    }

    // ------------------------------------------------------------------
    // Shared translation logic
    // ------------------------------------------------------------------
    private Response doTranslate(String text, String sourceLanguage) {
        try {
            LOG.info(String.format("Translating [%s] text: %.60s...", sourceLanguage, text));
            String translated = translatorService.translate(text, sourceLanguage);
            TranslationResponse resp = TranslationResponse.success(text, translated, sourceLanguage);
            return Response.ok(resp).build();

        } catch (TranslationException e) {
            LOG.log(Level.WARNING, "Translation failed: " + e.getMessage(), e);
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(TranslationResponse.error(e.getMessage()))
                    .build();
        }
    }
}

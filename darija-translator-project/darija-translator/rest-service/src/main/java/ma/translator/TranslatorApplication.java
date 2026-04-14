package ma.translator;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

/**
 * JAX-RS Application entry point.
 * All REST endpoints are available under /api/
 */
@ApplicationPath("/api")
public class TranslatorApplication extends Application {
}

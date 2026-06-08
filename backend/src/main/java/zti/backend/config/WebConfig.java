package zti.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global web configuration class for the Spring MVC framework.
 * <p>
 * This class implements {@link WebMvcConfigurer} to customize the default Spring MVC
 * settings. It is primarily used here to define global Cross-Origin Resource Sharing (CORS)
 * rules for all REST controllers in the application.
 * </p>
 * <p>
 * Note: If Spring Security is enabled (e.g., via {@code SecurityConfig}), the CORS configuration
 * defined there usually takes precedence. However, defining it here ensures CORS is properly
 * handled at the MVC level if Security is bypassed or removed.
 * </p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * The frontend application URL, injected from the application properties
     * (e.g., application.properties or application.yml).
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Configures cross-origin request processing.
     *
     * @param registry the {@link CorsRegistry} used to register CORS configurations
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Apply the CORS configuration to all paths and endpoints in the application ("/**")
        registry.addMapping("/**")

                // Dynamically allow requests only from the configured frontend URL
                .allowedOriginPatterns(frontendUrl)

                // Specify which HTTP methods are permitted for cross-origin requests
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")

                // Allow any headers to be sent in the request
                .allowedHeaders("*")

                // Allow credentials such as cookies or authorization headers to be included
                .allowCredentials(true);
    }
}
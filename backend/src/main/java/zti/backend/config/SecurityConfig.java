package zti.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security configuration class for the application.
 * <p>
 * This class configures Spring Security, specifically establishing CORS
 * (Cross-Origin Resource Sharing) policies and disabling strict security
 * mechanisms like CSRF and default authentication methods to allow seamless
 * communication with the frontend application.
 * </p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * The frontend application URL, injected from the application properties.
     * Used to configure the allowed origin for CORS requests.
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Configures the main security filter chain.
     *
     * @param http the {@link HttpSecurity} object to configure
     * @return the built {@link SecurityFilterChain}
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF (Cross-Site Request Forgery) protection
                // Often disabled for stateless REST APIs that do not rely on browser cookies for session management
                .csrf(csrf -> csrf.disable())

                // Enable CORS integration (applies the settings from the corsConfigurationSource bean)
                .cors(Customizer.withDefaults())

                // Configure authorization rules for specific endpoints
                .authorizeHttpRequests(auth -> auth
                        // Permit public access to all API and WebSocket (ws) endpoints without authentication
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        // Fallback: permit any other request (useful for development/testing environments)
                        .anyRequest().permitAll()
                )

                // Disable the default browser prompt for HTTP Basic authentication
                .httpBasic(httpBasic -> httpBasic.disable())
                // Disable the default Spring Security HTML login form
                .formLogin(form -> form.disable());

        return http.build();
    }

    /**
     * Defines the CORS configuration source.
     * <p>
     * This bean dictates which origins, HTTP methods, and headers are permitted
     * when requests are made from an external domain (e.g., the frontend application).
     * </p>
     *
     * @return the configured {@link CorsConfigurationSource}
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Restrict allowed origins strictly to the configured frontend URL
        configuration.setAllowedOriginPatterns(Arrays.asList(frontendUrl));

        // Allow all standard HTTP methods required by the REST API operations
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allow all headers to pass through in the request
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (e.g., cookies, authorization headers) to be included in cross-origin requests
        configuration.setAllowCredentials(true);

        // Register the defined CORS configuration to apply to all URL paths ("/**")
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
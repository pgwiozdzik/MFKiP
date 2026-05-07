package zti.backend.config;

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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Wyłączamy CSRF (często blokuje POST/PUT na localhost podczas developmentu)
                .csrf(csrf -> csrf.disable())

                // 2. Aktywujemy obsługę CORS (będzie korzystać z bean'a poniżej)
                .cors(Customizer.withDefaults())

                // 3. Konfigurujemy dostęp do ścieżek
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**").permitAll() // Pozwól wszystkim na dostęp do API
                        .requestMatchers("/ws/**").permitAll()  // Pozwól na WebSockety
                        .anyRequest().permitAll()               // Na razie pozwól na wszystko inne
                )

                // 4. WYŁĄCZAMY okienko logowania (Basic Auth)
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable());

        return http.build();
    }

    // Dodatkowy Bean konfigurujący CORS dla Security
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
package zti.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import zti.backend.dto.LoginRequest;

import java.util.Map;

/**
 * REST controller responsible for handling authentication requests.
 * <p>
 * This controller provides a simple role-based login mechanism by verifying
 * the provided credentials against configured plain-text passwords.
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * The password required for the 'reception' role, injected from application properties.
     */
    @Value("${app.auth.password.reception}")
    private String receptionPassword;

    /**
     * The password required for the 'stage' role, injected from application properties.
     */
    @Value("${app.auth.password.stage}")
    private String stagePassword;

    /**
     * The password required for the 'admin' role, injected from application properties.
     */
    @Value("${app.auth.password.admin}")
    private String adminPassword;

    /**
     * Authenticates a user based on the provided role and password.
     *
     * @param request the {@link LoginRequest} data transfer object containing the requested role and password
     * @return a {@link ResponseEntity} with HTTP 200 (OK) and a success message if authorized,
     * or HTTP 401 (Unauthorized) with an error message if authentication fails
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String role = request.getRole();
        String password = request.getPassword();

        boolean isAuthorized = false;

        if ("reception".equals(role) && receptionPassword.equals(password)) {
            isAuthorized = true;
        } else if ("stage".equals(role) && stagePassword.equals(password)) {
            isAuthorized = true;
        } else if ("admin".equals(role) && adminPassword.equals(password)) {
            isAuthorized = true;
        }

        if (isAuthorized) {
            return ResponseEntity.ok(Map.of("message", "Zalogowano pomyślnie", "role", role));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Błędne hasło"));
        }
    }
}
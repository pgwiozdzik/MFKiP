package zti.backend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import zti.backend.dto.LoginRequest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the {@link AuthController} class.
 * <p>
 * This test suite isolates the authentication logic without starting the Spring context
 * or a mock web server. It uses reflection to inject the required password properties
 * and directly invokes the controller method to verify authorization outcomes.
 * </p>
 */
class AuthControllerTest {

    private AuthController authController;

    /**
     * Sets up the test environment before each test execution.
     * Initializes the controller and injects mock passwords using reflection.
     */
    @BeforeEach
    void setUp() {
        authController = new AuthController();

        // Inject test passwords normally provided by @Value in application.properties
        ReflectionTestUtils.setField(authController, "receptionPassword", "testRec");
        ReflectionTestUtils.setField(authController, "stagePassword", "testStage");
        ReflectionTestUtils.setField(authController, "adminPassword", "testAdmin");
    }

    /**
     * Tests successful login for the 'reception' role.
     */
    @Test
    @SuppressWarnings("unchecked")
    void shouldLoginReceptionSuccessfully() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setRole("reception");
        request.setPassword("testRec");

        // When
        ResponseEntity<?> response = authController.login(request);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Should return HTTP 200 OK");
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Zalogowano pomyślnie", body.get("message"));
        assertEquals("reception", body.get("role"));
    }

    /**
     * Tests successful login for the 'stage' role.
     */
    @Test
    @SuppressWarnings("unchecked")
    void shouldLoginStageSuccessfully() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setRole("stage");
        request.setPassword("testStage");

        // When
        ResponseEntity<?> response = authController.login(request);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Should return HTTP 200 OK");
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("stage", body.get("role"));
    }

    /**
     * Tests successful login for the 'admin' role.
     */
    @Test
    @SuppressWarnings("unchecked")
    void shouldLoginAdminSuccessfully() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setRole("admin");
        request.setPassword("testAdmin");

        // When
        ResponseEntity<?> response = authController.login(request);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Should return HTTP 200 OK");
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("admin", body.get("role"));
    }

    /**
     * Tests the scenario where a correct role is provided but with an incorrect password.
     */
    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnUnauthorizedForWrongPassword() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setRole("admin");
        request.setPassword("wrongPassword");

        // When
        ResponseEntity<?> response = authController.login(request);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode(), "Should return HTTP 401 Unauthorized");
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Błędne hasło", body.get("error"));
    }

    /**
     * Tests the scenario where a completely unknown role is requested.
     */
    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnUnauthorizedForUnknownRole() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setRole("hacker");
        request.setPassword("testAdmin");

        // When
        ResponseEntity<?> response = authController.login(request);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode(), "Should return HTTP 401 Unauthorized");
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Błędne hasło", body.get("error"));
    }
}
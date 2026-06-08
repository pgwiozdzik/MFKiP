package zti.backend.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Unit tests for the {@link LoginRequest} Data Transfer Object (DTO).
 * <p>
 * This test suite verifies the basic functionality of the getters and setters
 * to ensure data is correctly encapsulated and retrieved during the authentication process.
 * </p>
 */
class LoginRequestTest {

    /**
     * Tests the getter and setter methods for the 'role' field.
     */
    @Test
    void shouldSetAndGetRole() {
        // Given
        LoginRequest request = new LoginRequest();
        String expectedRole = "admin";

        // When
        request.setRole(expectedRole);

        // Then
        assertEquals(expectedRole, request.getRole(), "The role getter should return the value that was set");
    }

    /**
     * Tests the getter and setter methods for the 'password' field.
     */
    @Test
    void shouldSetAndGetPassword() {
        // Given
        LoginRequest request = new LoginRequest();
        String expectedPassword = "secretPassword123";

        // When
        request.setPassword(expectedPassword);

        // Then
        assertEquals(expectedPassword, request.getPassword(), "The password getter should return the value that was set");
    }

    /**
     * Tests that a newly instantiated LoginRequest has null values by default.
     */
    @Test
    void shouldHaveNullValuesByDefault() {
        // Given
        LoginRequest request = new LoginRequest();

        // Then
        assertNull(request.getRole(), "Role should be null upon initialization");
        assertNull(request.getPassword(), "Password should be null upon initialization");
    }
}
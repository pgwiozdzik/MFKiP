package zti.backend.dto;

/**
 * Data Transfer Object (DTO) for handling login requests.
 * <p>
 * This class encapsulates the credentials sent by the client (frontend)
 * when attempting to authenticate and access a specific role-based view.
 * </p>
 */
public class LoginRequest {

    private String role;
    private String password;

    /**
     * Gets the requested role for authentication.
     *
     * @return the requested role name (e.g., "reception", "stage", "admin")
     */
    public String getRole() {
        return role;
    }

    /**
     * Sets the requested role for authentication.
     *
     * @param role the role name to set
     */
    public void setRole(String role) {
        this.role = role;
    }

    /**
     * Gets the password provided for authentication.
     *
     * @return the plain-text password provided by the client
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password provided for authentication.
     *
     * @param password the plain-text password to set
     */
    public void setPassword(String password) {
        this.password = password;
    }
}
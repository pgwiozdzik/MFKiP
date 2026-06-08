package zti.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Test class for the main application entry point.
 * <p>
 * This test verifies that the Spring application context can successfully
 * bootstrap and initialize all required beans and configurations without throwing
 * any startup exceptions.
 * </p>
 */
@SpringBootTest
class BackendApplicationTest {

    /**
     * Tests if the application context loads correctly.
     * <p>
     * The method body is intentionally left empty. The test will automatically pass
     * if the Spring Framework successfully creates the application context. It will
     * fail if there are configuration issues, circular dependencies, or fatal startup errors.
     * </p>
     */
    @Test
    void contextLoads() {
        // The test passes if the context loads without exceptions.
    }

}
package zti.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * The main entry point for the backend Spring Boot application.
 * <p>
 * This class contains the {@code main} method which is responsible for
 * bootstrapping and launching the entire Spring application context.
 * </p>
 */
@SpringBootApplication
public class BackendApplication {

    /**
     * The main method that starts the Spring application.
     *
     * @param args command-line arguments passed to the application during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
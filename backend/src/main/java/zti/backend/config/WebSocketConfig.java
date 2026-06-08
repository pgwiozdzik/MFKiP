package zti.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

/**
 * Configuration class for WebSocket and STOMP (Simple Text Oriented Messaging Protocol) messaging.
 * <p>
 * This class enables a WebSocket message broker and configures the endpoints
 * and routing rules for real-time, bidirectional communication between the
 * server and connected clients (e.g., the frontend application).
 * </p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * The frontend application URL, injected from the application properties.
     * Used to restrict WebSocket connections to trusted origins.
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Configures the message broker routing options.
     *
     * @param config the {@link MessageBrokerRegistry} to configure
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker to route messages back to the client
        // on destinations prefixed with "/topic" (e.g., broadcasting updates)
        config.enableSimpleBroker("/topic");

        // Set the prefix for messages that are bound for methods annotated with
        // @MessageMapping in Spring controllers
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers STOMP endpoints mapping each to a specific URL.
     *
     * @param registry the {@link StompEndpointRegistry} to configure
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws-mfkip" endpoint which clients will use to connect to the WebSocket server
        registry.addEndpoint("/ws-mfkip")

                // Restrict connection attempts to the explicitly configured frontend URL to prevent CSRF attacks
                .setAllowedOriginPatterns(frontendUrl)

                // Enable SockJS fallback options for browsers or networks that do not support WebSockets
                .withSockJS()

                // Add an interceptor to copy HTTP session attributes to the WebSocket session during the handshake
                .setInterceptors(new HttpSessionHandshakeInterceptor());
    }
}
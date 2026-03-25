package zti.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Serwer wysyła wiadomości do klientów na kanały zaczynające się od /topic
        config.enableSimpleBroker("/topic");
        // Klienci wysyłają wiadomości do serwera na ścieżki zaczynające się od /app
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-mfkip")
                .setAllowedOriginPatterns("http://localhost:5173") // Dokładny adres frontendu
                .withSockJS()
                .setInterceptors(new HttpSessionHandshakeInterceptor()); // Opcjonalnie, pomaga w sesjach
    }
}
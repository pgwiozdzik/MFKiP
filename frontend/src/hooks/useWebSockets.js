import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export const useWebSockets = (topic, onMessageReceived) => {
    const stompClientRef = useRef(null);

    useEffect(() => {
        // WYMUSZENIE: Tylko czysty websocket, bez xhr, bez eventsource
        const socket = new SockJS('http://localhost:8081/ws-mfkip', null, {
            transports: ['websocket'],
            // To zapobiega próbom łączenia się przez inne kanały
        });

        const stompClient = Stomp.over(socket);

        // Wyłączamy logi "Heartbeat", żeby nie śmieciły w konsoli
        stompClient.debug = null;

        stompClient.connect({},
            () => {
                console.log(`%c WS połączony: ${topic} `, 'background: #222; color: #bada55');
                stompClient.subscribe(topic, (message) => {
                    onMessageReceived(message.body);
                });
            },
            (error) => {
                console.warn('WS rozłączony lub błąd. Próba za 5s...');
            }
        );

        stompClientRef.current = stompClient;

        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
        };
    }, [topic]);
    // UWAGA: upewnij się, że onMessageReceived jest stabilne (np. przez useCallback w komponencie)
};
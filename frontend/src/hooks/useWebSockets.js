import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export const useWebSockets = (topic, onMessageReceived) => {
    // Używamy useRef dla callbacku, aby subskrypcja WS zawsze miała dostęp
    // do najnowszej wersji funkcji bez konieczności restartowania połączenia.
    const callbackRef = useRef(onMessageReceived);

    useEffect(() => {
        callbackRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8081/ws-mfkip', null, {
            transports: ['websocket'],
        });

        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({},
            () => {
                console.log(`%c WS połączony: ${topic} `, 'background: #222; color: #bada55');
                stompClient.subscribe(topic, (message) => {
                    // Wywołujemy funkcję przez ref, dzięki czemu zawsze mamy aktualny 'dayName'
                    if (callbackRef.current) {
                        callbackRef.current(message.body);
                    }
                });
            },
            (error) => {
                console.warn('WS rozłączony lub błąd:', error);
            }
        );

        return () => {
            if (stompClient.connected) {
                stompClient.disconnect();
            }
        };
    }, [topic]); // Restartujemy tylko gdy zmienia się kanał (topic)
};
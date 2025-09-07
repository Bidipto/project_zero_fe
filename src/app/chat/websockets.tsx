import React, { createContext, useCallback, ReactNode, useState, useEffect, useRef, FC, useContext } from "react";

export interface WebSocketMessage {
    type: 'message' | 'typing' | 'user_status' | 'chat_created' | 'user_list' | 'chat_list' | 'message_status' | 'error' | 'heartbeat';
    data: string;
    chat_id?: string;
    user_id?: string;
    timestamp?: string;
}

export interface WebsocketContextValue {
    socket: WebSocket | null;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'connection error';
    lastMessage: WebSocketMessage | null;
    sendMessage: (content: string, chatId: string | number, otherUserId: string | number) => void;
    connect: (userId: string | number) => void;
    disconnect: () => void;
    reconnect: () => void;
    subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebsocketContextValue | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
    baseUrl: string;
}

export const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, baseUrl }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'connection error'>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
    const subscribersRef = useRef<((message: WebSocketMessage) => void)[]>([]);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);   
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const heartbeatInterval = 30000;

    const startHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                // Send heartbeat - you can customize this based on your backend needs
                const heartbeat: WebSocketMessage = {
                    type: 'heartbeat',
                    data: 'ping',
                    timestamp: new Date().toISOString()
                };
                // socket.send(JSON.stringify(heartbeat));
            }
        }, heartbeatInterval);
    }, [socket, heartbeatInterval]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    const notifySubscribers = useCallback((message: WebSocketMessage) => {
        subscribersRef.current.forEach(callback => callback(message));
    }, []);

    const connect = useCallback((userId: string | number) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            return;
        }

        // Validate user ID before connecting
        if (!userId || userId === 'undefined' || userId === 'null') {
            console.error('Invalid user ID for WebSocket connection:', userId);
            setConnectionStatus('connection error');
            return;
        }

        setConnectionStatus('connecting');
        setCurrentUserId(userId);
        reconnectAttemptsRef.current = 0;

        try {
            const wsUrlSimple = `ws://localhost:8000/v1/chat/ws/${userId}`;
            
            console.log('Connecting to WebSocket:', wsUrlSimple);
            console.log('User ID:', userId);
            
            const websocket = new WebSocket(wsUrlSimple);
            
            websocket.onopen = () => {
                console.log('WebSocket connected successfully');
                setConnectionStatus('connected');
                setSocket(websocket);
                reconnectAttemptsRef.current = 0;
                startHeartbeat();
                
            };
            websocket.onmessage = (event) => {
                try {
                    console.log('EVENT DATA:', event.data);
                    const messageText = event.data;
                    console.log('WebSocket received:', messageText);
                    const message: WebSocketMessage = {
                        type: 'message',
                        data: messageText,
                        timestamp: new Date().toISOString()
                    };
                    
                    setLastMessage(message);
                    notifySubscribers(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            websocket.onclose = (event) => {
                console.log('WebSocket connection closed - attempting reconnect');
                setSocket(null);
                setConnectionStatus('disconnected');
                //stopHeartbeat();
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 + (reconnectAttemptsRef.current * 1000), 5000);
                    reconnectAttemptsRef.current++;
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect(userId);
                    }, delay);
                } else {
                    setTimeout(() => {
                        reconnectAttemptsRef.current = 0;
                        connect(userId);
                    }, 10000); 
                }
            };

            websocket.onerror = (error) => {
                console.log('WebSocket connection error - will retry');
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('connection error');
        }
    }, [baseUrl, socket, startHeartbeat, stopHeartbeat, notifySubscribers, maxReconnectAttempts]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        stopHeartbeat();
        
        if (socket) {
            socket.close(1000, 'User disconnected');
            setSocket(null);
        }
        
        setConnectionStatus('disconnected');
        setCurrentUserId(null);
        reconnectAttemptsRef.current = 0;
    }, [socket, stopHeartbeat]);

    const reconnect = useCallback(() => {
        if (currentUserId !== null) {
            disconnect();
            setTimeout(() => connect(currentUserId), 1000);
        }
    }, [currentUserId, disconnect, connect]);

    const sendMessage = useCallback((content: string, chatId: string | number, otherUserId: string | number) => {
        console.log('---------------------------------------');
        console.log('Prepared WebSocket message:', content);

        // if (!currentUserId) {
        //     console.error('No user ID set for WebSocket');
        //     return;
        // }

        // Format message according to backend expectation: "user_id_chat_id_other_user_id_message_content"
        const message = `$16_${chatId}_17_${content}`;
        socket.send(message);
        console.log('SEND');
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('Sending WebSocket message:', message);
            socket.send(message);
        } else {
            console.log('WebSocket not ready, message will be queued for retry');
            setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    console.log('Sending queued WebSocket message:', message);
                    socket.send(message);
                }
            }, 1000);
        }
    }, [socket, currentUserId]);

    const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
        subscribersRef.current.push(callback);
        
        // Return unsubscribe function
        return () => {
            subscribersRef.current = subscribersRef.current.filter(cb => cb !== callback);
        };
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const contextValue: WebsocketContextValue = {
        socket,
        connectionStatus,
        lastMessage,
        sendMessage,
        connect,
        disconnect,
        reconnect,
        subscribe
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};

// Hook to use WebSocket context
export const useWebSocket = (): WebsocketContextValue => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
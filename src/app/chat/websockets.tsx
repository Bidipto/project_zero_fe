import React, { createContext, useCallback, ReactNode, useState, useEffect, useRef, FC } from "react";

export interface WebSocketMessage {
    type: 'message' | 'typing' | 'user_status' | 'chat_created' | 'user_list' | 'chat_list' | 'message_status' | 'error' | 'heartbeat';
    data: string;
    chat_id?: string;
    user_id?: string,
    timestamp?: string;

}

export interface WebsocketContextValue {
    socket: WebSocket | null;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'connection error';
    lastMessage: WebSocketMessage | null;
    sendMessage: (message: WebSocketMessage) => void;
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;
    subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebsocketContextValue | null>(null);
interface WebSocketProviderProps {
    children: ReactNode;
    url: string;
    token: string | null;
}


export const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, url, token }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'connection error'>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const subscribersRef = useRef<((message: WebSocketMessage) => void)[]>([]);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);   
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const heartbeatInterval = 30000; // 30 seconds
    const startHeartbeat = useCallback(() => {
        
    }
}
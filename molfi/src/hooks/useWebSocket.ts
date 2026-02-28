/**
 * WebSocket Hook for Real-Time Updates
 * Provides auto-reconnect, channel subscriptions, and message handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketMessage = {
    type: string;
    channel: string;
    data: any;
    timestamp: number;
};

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    url: string;
    channels?: string[];
    autoReconnect?: boolean;
    reconnectInterval?: number;
    onMessage?: (message: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

export function useWebSocket({
    url,
    channels = [],
    autoReconnect = true,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
}: UseWebSocketOptions) {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const subscribedChannelsRef = useRef<Set<string>>(new Set());

    // Send message to WebSocket
    const send = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        }
        return false;
    }, []);

    // Subscribe to a channel
    const subscribe = useCallback((channel: string) => {
        if (!subscribedChannelsRef.current.has(channel)) {
            subscribedChannelsRef.current.add(channel);
            send({ type: 'subscribe', channel });
        }
    }, [send]);

    // Unsubscribe from a channel
    const unsubscribe = useCallback((channel: string) => {
        if (subscribedChannelsRef.current.has(channel)) {
            subscribedChannelsRef.current.delete(channel);
            send({ type: 'unsubscribe', channel });
        }
    }, [send]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            setStatus('connecting');
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                setStatus('connected');

                // Resubscribe to channels
                subscribedChannelsRef.current.forEach(channel => {
                    ws.send(JSON.stringify({ type: 'subscribe', channel }));
                });

                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(message);
                    onMessage?.(message);
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
                setStatus('error');
                onError?.(error);
            };

            ws.onclose = () => {
                console.log('[WebSocket] Disconnected');
                setStatus('disconnected');
                wsRef.current = null;
                onDisconnect?.();

                // Auto-reconnect
                if (autoReconnect) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('[WebSocket] Attempting to reconnect...');
                        connect();
                    }, reconnectInterval);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[WebSocket] Connection failed:', error);
            setStatus('error');
        }
    }, [url, autoReconnect, reconnectInterval, onConnect, onMessage, onDisconnect, onError]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setStatus('disconnected');
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Subscribe to initial channels
    useEffect(() => {
        if (status === 'connected') {
            channels.forEach(channel => subscribe(channel));
        }
    }, [status, channels, subscribe]);

    return {
        status,
        lastMessage,
        send,
        subscribe,
        unsubscribe,
        connect,
        disconnect,
    };
}

/**
 * Hook for orderbook updates
 */
export function useOrderbookWebSocket(pair: string) {
    const [orderbook, setOrderbook] = useState<any>(null);

    const { status } = useWebSocket({
        url: `ws://localhost:3001/api/ws`,
        channels: [`orderbook:${pair}`],
        onMessage: (message) => {
            if (message.type === 'orderbook' && message.channel === `orderbook:${pair}`) {
                setOrderbook(message.data);
            }
        },
    });

    return { orderbook, status };
}

/**
 * Hook for trade updates
 */
export function useTradesWebSocket(pair: string) {
    const [trades, setTrades] = useState<any[]>([]);

    const { status } = useWebSocket({
        url: `ws://localhost:3001/api/ws`,
        channels: [`trades:${pair}`],
        onMessage: (message) => {
            if (message.type === 'trade' && message.channel === `trades:${pair}`) {
                setTrades(prev => [message.data, ...prev].slice(0, 50));
            }
        },
    });

    return { trades, status };
}

/**
 * Hook for price updates
 */
export function usePriceWebSocket(pairs: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});

    const { status } = useWebSocket({
        url: `ws://localhost:3001/api/ws`,
        channels: ['prices'],
        onMessage: (message) => {
            if (message.type === 'price') {
                setPrices(prev => ({
                    ...prev,
                    [message.data.pair]: message.data.price,
                }));
            }
        },
    });

    return { prices, status };
}

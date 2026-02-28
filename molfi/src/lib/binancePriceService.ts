// Real-time price service using Binance WebSocket API
// Free, no authentication required

export interface PriceData {
    symbol: string;
    price: number;
    change24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    lastUpdate: number;
}

class BinancePriceService {
    private ws: WebSocket | null = null;
    private prices: Map<string, PriceData> = new Map();
    private listeners: Set<(prices: Map<string, PriceData>) => void> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;

    // Binance symbol mapping — 9 supported USDT pairs
    private symbolMap: Record<string, string> = {
        'BTC/USDT': 'btcusdt',
        'ETH/USDT': 'ethusdt',
        'SOL/USDT': 'solusdt',
        'LINK/USDT': 'linkusdt',
        'DOGE/USDT': 'dogeusdt',
        'AVAX/USDT': 'avaxusdt',
        'MATIC/USDT': 'maticusdt',
        'DOT/USDT': 'dotusdt',
        'NEAR/USDT': 'nearusdt',
    };

    connect() {
        if (typeof window === 'undefined') return;

        const streams = Object.values(this.symbolMap).map(s => `${s}@ticker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('✅ Connected to Binance WebSocket');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.data) {
                    this.handlePriceUpdate(data.data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('❌ Disconnected from Binance WebSocket');
            // Reconnect after 5 seconds
            this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
        };
    }

    private handlePriceUpdate(data: any) {
        const symbol = this.getSymbolFromBinance(data.s);
        if (!symbol) return;

        const priceData: PriceData = {
            symbol,
            price: parseFloat(data.c), // Current price
            change24h: parseFloat(data.P), // 24h price change percent
            high24h: parseFloat(data.h), // 24h high
            low24h: parseFloat(data.l), // 24h low
            volume24h: parseFloat(data.v), // 24h volume
            lastUpdate: Date.now(),
        };

        this.prices.set(symbol, priceData);
        this.notifyListeners();
    }

    private getSymbolFromBinance(binanceSymbol: string): string | null {
        const normalized = binanceSymbol.toLowerCase();
        for (const [symbol, binance] of Object.entries(this.symbolMap)) {
            if (binance === normalized) {
                return symbol;
            }
        }
        return null;
    }

    subscribe(callback: (prices: Map<string, PriceData>) => void) {
        this.listeners.add(callback);
        // Immediately send current prices
        if (this.prices.size > 0) {
            callback(this.prices);
        }
        return () => this.listeners.delete(callback);
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback(this.prices));
    }

    getPrice(symbol: string): PriceData | undefined {
        return this.prices.get(symbol);
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }
}

// Singleton instance
export const binancePriceService = new BinancePriceService();

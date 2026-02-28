/**
 * Orderbook Engine
 * Manages off-chain orderbook with price-time priority
 */

export interface Order {
    id: string;
    trader: string;
    agent: string;
    pair: string;
    price: number;
    size: number;
    filled: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    status: 'pending' | 'filled' | 'cancelled' | 'partial';
    timestamp: number;
}

export interface OrderbookLevel {
    price: number;
    size: number;
    total: number;
    orders: number;
}

export interface Orderbook {
    pair: string;
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
    lastPrice: number;
    timestamp: number;
}

export interface Trade {
    id: string;
    pair: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    timestamp: number;
    buyOrderId: string;
    sellOrderId: string;
}

class OrderbookEngine {
    private orders: Map<string, Order> = new Map();
    private orderbooks: Map<string, { bids: Order[]; asks: Order[] }> = new Map();
    private trades: Map<string, Trade[]> = new Map();
    private nextOrderId = 1;
    private nextTradeId = 1;

    constructor() {
        // Initialize orderbooks for supported pairs
        this.orderbooks.set('BTC/USDT', { bids: [], asks: [] });
        this.orderbooks.set('ETH/USDT', { bids: [], asks: [] });
        this.trades.set('BTC/USDT', []);
        this.trades.set('ETH/USDT', []);
    }

    /**
     * Submit a new order
     */
    submitOrder(order: Omit<Order, 'id' | 'filled' | 'status' | 'timestamp'>): Order {
        const newOrder: Order = {
            ...order,
            id: `order_${this.nextOrderId++}`,
            filled: 0,
            status: 'pending',
            timestamp: Date.now(),
        };

        this.orders.set(newOrder.id, newOrder);

        // Add to orderbook
        const book = this.orderbooks.get(order.pair);
        if (!book) throw new Error('Invalid pair');

        if (order.type === 'market') {
            // Execute market order immediately
            this.executeMarketOrder(newOrder);
        } else {
            // Add limit order to book
            if (order.side === 'buy') {
                book.bids.push(newOrder);
                book.bids.sort((a, b) => b.price - a.price); // Highest price first
            } else {
                book.asks.push(newOrder);
                book.asks.sort((a, b) => a.price - b.price); // Lowest price first
            }

            // Try to match
            this.matchOrders(order.pair);
        }

        return newOrder;
    }

    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order || order.status === 'filled' || order.status === 'cancelled') {
            return false;
        }

        order.status = 'cancelled';

        // Remove from orderbook
        const book = this.orderbooks.get(order.pair);
        if (book) {
            if (order.side === 'buy') {
                book.bids = book.bids.filter(o => o.id !== orderId);
            } else {
                book.asks = book.asks.filter(o => o.id !== orderId);
            }
        }

        return true;
    }

    /**
     * Execute market order
     */
    private executeMarketOrder(order: Order): void {
        const book = this.orderbooks.get(order.pair);
        if (!book) return;

        const oppositeOrders = order.side === 'buy' ? book.asks : book.bids;
        let remaining = order.size;

        for (const oppositeOrder of oppositeOrders) {
            if (remaining <= 0) break;

            const fillSize = Math.min(remaining, oppositeOrder.size - oppositeOrder.filled);

            // Create trade
            this.createTrade(
                order.pair,
                oppositeOrder.price,
                fillSize,
                order.side,
                order.id,
                oppositeOrder.id
            );

            // Update orders
            order.filled += fillSize;
            oppositeOrder.filled += fillSize;
            remaining -= fillSize;

            // Update status
            if (oppositeOrder.filled >= oppositeOrder.size) {
                oppositeOrder.status = 'filled';
            } else {
                oppositeOrder.status = 'partial';
            }
        }

        // Update market order status
        if (order.filled >= order.size) {
            order.status = 'filled';
        } else if (order.filled > 0) {
            order.status = 'partial';
        }

        // Remove filled orders from book
        if (order.side === 'buy') {
            book.asks = book.asks.filter(o => o.status !== 'filled');
        } else {
            book.bids = book.bids.filter(o => o.status !== 'filled');
        }
    }

    /**
     * Match limit orders
     */
    private matchOrders(pair: string): void {
        const book = this.orderbooks.get(pair);
        if (!book || book.bids.length === 0 || book.asks.length === 0) return;

        while (book.bids.length > 0 && book.asks.length > 0) {
            const bestBid = book.bids[0];
            const bestAsk = book.asks[0];

            // Check if orders can match
            if (bestBid.price < bestAsk.price) break;

            const fillSize = Math.min(
                bestBid.size - bestBid.filled,
                bestAsk.size - bestAsk.filled
            );

            // Create trade at ask price (price-time priority)
            this.createTrade(
                pair,
                bestAsk.price,
                fillSize,
                'buy',
                bestBid.id,
                bestAsk.id
            );

            // Update orders
            bestBid.filled += fillSize;
            bestAsk.filled += fillSize;

            // Update status
            if (bestBid.filled >= bestBid.size) {
                bestBid.status = 'filled';
                book.bids.shift();
            } else {
                bestBid.status = 'partial';
            }

            if (bestAsk.filled >= bestAsk.size) {
                bestAsk.status = 'filled';
                book.asks.shift();
            } else {
                bestAsk.status = 'partial';
            }
        }
    }

    /**
     * Create a trade
     */
    private createTrade(
        pair: string,
        price: number,
        size: number,
        side: 'buy' | 'sell',
        buyOrderId: string,
        sellOrderId: string
    ): void {
        const trade: Trade = {
            id: `trade_${this.nextTradeId++}`,
            pair,
            price,
            size,
            side,
            timestamp: Date.now(),
            buyOrderId,
            sellOrderId,
        };

        const trades = this.trades.get(pair);
        if (trades) {
            trades.unshift(trade); // Add to front
            if (trades.length > 100) trades.pop(); // Keep last 100 trades
        }
    }

    /**
     * Get orderbook for a pair
     */
    getOrderbook(pair: string): Orderbook {
        const book = this.orderbooks.get(pair);
        if (!book) throw new Error('Invalid pair');

        // Aggregate orders by price level
        const bids = this.aggregateLevels(book.bids);
        const asks = this.aggregateLevels(book.asks);

        // Get last trade price
        const trades = this.trades.get(pair) || [];
        const lastPrice = trades.length > 0 ? trades[0].price : 0;

        return {
            pair,
            bids,
            asks,
            lastPrice,
            timestamp: Date.now(),
        };
    }

    /**
     * Aggregate orders into price levels
     */
    private aggregateLevels(orders: Order[]): OrderbookLevel[] {
        const levels = new Map<number, { size: number; orders: number }>();

        for (const order of orders) {
            if (order.status === 'cancelled' || order.status === 'filled') continue;

            const remaining = order.size - order.filled;
            const level = levels.get(order.price) || { size: 0, orders: 0 };
            level.size += remaining;
            level.orders += 1;
            levels.set(order.price, level);
        }

        let total = 0;
        return Array.from(levels.entries())
            .map(([price, { size, orders }]) => {
                total += size;
                return { price, size, total, orders };
            });
    }

    /**
     * Get recent trades
     */
    getRecentTrades(pair: string, limit: number = 20): Trade[] {
        const trades = this.trades.get(pair) || [];
        return trades.slice(0, limit);
    }

    /**
     * Get order by ID
     */
    getOrder(orderId: string): Order | undefined {
        return this.orders.get(orderId);
    }

    /**
     * Get all orders for an agent
     */
    getAgentOrders(agentId: string, pair?: string): Order[] {
        const orders = Array.from(this.orders.values());
        return orders.filter(o =>
            o.agent === agentId &&
            (!pair || o.pair === pair)
        );
    }
}

// Singleton instance
export const orderbookEngine = new OrderbookEngine();

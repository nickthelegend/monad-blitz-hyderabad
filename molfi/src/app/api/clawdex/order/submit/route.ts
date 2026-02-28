import { NextRequest, NextResponse } from 'next/server';
import { orderbookEngine } from '@/lib/clawdex/orderbook-engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trader, agent, pair, price, size, side, type } = body;

        // Validation
        if (!trader || !agent || !pair || !size || !side || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!['BTC/USDT', 'ETH/USDT'].includes(pair)) {
            return NextResponse.json(
                { error: 'Unsupported pair. Use BTC/USDT or ETH/USDT' },
                { status: 400 }
            );
        }

        if (!['buy', 'sell'].includes(side)) {
            return NextResponse.json(
                { error: 'Side must be buy or sell' },
                { status: 400 }
            );
        }

        if (!['market', 'limit'].includes(type)) {
            return NextResponse.json(
                { error: 'Type must be market or limit' },
                { status: 400 }
            );
        }

        if (type === 'limit' && !price) {
            return NextResponse.json(
                { error: 'Price required for limit orders' },
                { status: 400 }
            );
        }

        // Submit order to orderbook engine
        const order = orderbookEngine.submitOrder({
            trader,
            agent,
            pair,
            price: price || 0,
            size,
            side,
            type,
        });

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                pair: order.pair,
                price: order.price,
                size: order.size,
                filled: order.filled,
                side: order.side,
                type: order.type,
                status: order.status,
                timestamp: order.timestamp,
            },
            message: `Order ${order.id} submitted successfully`,
        });

    } catch (error: any) {
        console.error('Error in /api/clawdex/order/submit:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit order' },
            { status: 500 }
        );
    }
}

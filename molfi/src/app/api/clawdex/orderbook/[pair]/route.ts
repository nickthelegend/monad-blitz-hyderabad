import { NextRequest, NextResponse } from 'next/server';
import { orderbookEngine } from '@/lib/clawdex/orderbook-engine';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pair: string }> }
) {
    try {
        const { pair } = await params;

        // Convert URL format to contract format
        const contractPair = pair.replace('-', '/');

        if (!['BTC/USDT', 'ETH/USDT'].includes(contractPair)) {
            return NextResponse.json(
                { error: 'Invalid pair. Use BTC-USDT or ETH-USDT' },
                { status: 400 }
            );
        }

        // Get orderbook from engine
        const orderbook = orderbookEngine.getOrderbook(contractPair);

        return NextResponse.json({
            success: true,
            orderbook,
        });

    } catch (error: any) {
        console.error('Error in /api/clawdex/orderbook/[pair]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orderbook' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { orderbookEngine } from '@/lib/clawdex/orderbook-engine';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pair: string }> }
) {
    try {
        const { pair } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        // Convert URL format to contract format
        const contractPair = pair.replace('-', '/');

        if (!['BTC/USDT', 'ETH/USDT'].includes(contractPair)) {
            return NextResponse.json(
                { error: 'Invalid pair. Use BTC-USDT or ETH-USDT' },
                { status: 400 }
            );
        }

        // Get recent trades from engine
        const trades = orderbookEngine.getRecentTrades(contractPair, limit);

        return NextResponse.json({
            success: true,
            pair: contractPair,
            trades,
            count: trades.length,
        });

    } catch (error: any) {
        console.error('Error in /api/clawdex/trades/[pair]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch trades' },
            { status: 500 }
        );
    }
}

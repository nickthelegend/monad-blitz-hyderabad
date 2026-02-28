import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ORACLE_ABI = [
    "function getLatestPrice(string pair) view returns (uint256)",
    "function getPriceWithMetadata(string pair) view returns (uint256 price, uint256 timestamp, uint80 roundId)"
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pair: string }> }
) {
    try {
        const { pair } = await params;

        // Validate pair
        const validPairs = ['BTC-USDT', 'ETH-USDT'];
        if (!validPairs.includes(pair)) {
            return NextResponse.json(
                { error: 'Invalid pair. Use BTC-USDT or ETH-USDT' },
                { status: 400 }
            );
        }

        // Convert URL format to contract format
        const contractPair = pair.replace('-', '/');

        // Connect to oracle
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const oracleAddress = process.env.NEXT_PUBLIC_CHAINLINK_ORACLE!;
        const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);

        // Get price with metadata
        const [price, timestamp, roundId] = await oracle.getPriceWithMetadata(contractPair);

        const priceFormatted = ethers.formatUnits(price, 18);

        return NextResponse.json({
            success: true,
            pair: contractPair,
            price: priceFormatted,
            priceRaw: price.toString(),
            timestamp: Number(timestamp),
            roundId: roundId.toString(),
            source: 'chainlink',
            fetchedAt: Date.now(),
        });

    } catch (error: any) {
        console.error('Error in /api/price/[pair]:', error);

        // Return mock data for development if oracle not deployed
        if (error.message?.includes('call revert exception')) {
            const { pair } = await params;
            const mockPrices: Record<string, string> = {
                'BTC-USDT': '45250.00',
                'ETH-USDT': '2480.50',
            };

            return NextResponse.json({
                success: true,
                pair: pair.replace('-', '/'),
                price: mockPrices[pair] || '0',
                priceRaw: ethers.parseUnits(mockPrices[pair] || '0', 18).toString(),
                timestamp: Math.floor(Date.now() / 1000),
                roundId: '0',
                source: 'mock',
                fetchedAt: Date.now(),
                warning: 'Using mock data - deploy oracle contracts',
            });
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch price' },
            { status: 500 }
        );
    }
}

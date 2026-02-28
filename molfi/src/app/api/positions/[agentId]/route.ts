import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const PERP_DEX_ABI = [
    "function getAgentPositions(address agent) view returns (uint256[])",
    "function getPosition(uint256 positionId) view returns (tuple(uint256 id, address trader, address agent, string pair, uint256 size, uint256 collateral, uint256 entryPrice, uint256 leverage, bool isLong, uint256 timestamp, int256 fundingIndex, bool isOpen))",
    "function getUnrealizedPnL(uint256 positionId) view returns (int256)",
    "function getLiquidationPrice(uint256 positionId) view returns (uint256)"
];

const ORACLE_ABI = [
    "function getLatestPrice(string pair) view returns (uint256)"
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        if (!agentId || !ethers.isAddress(agentId)) {
            return NextResponse.json(
                { error: 'Valid agent address is required' },
                { status: 400 }
            );
        }

        // Connect to contracts
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const perpDexAddress = process.env.NEXT_PUBLIC_PERP_DEX!;
        const oracleAddress = process.env.NEXT_PUBLIC_CHAINLINK_ORACLE!;

        const perpDex = new ethers.Contract(perpDexAddress, PERP_DEX_ABI, provider);
        const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);

        // Get all position IDs for agent
        const positionIds = await perpDex.getAgentPositions(agentId);

        // Fetch details for each position
        const positions = await Promise.all(
            positionIds.map(async (id: bigint) => {
                try {
                    const position = await perpDex.getPosition(id);

                    // Only return open positions
                    if (!position.isOpen) return null;

                    // Get current price and PnL
                    const currentPrice = await oracle.getLatestPrice(position.pair);
                    const unrealizedPnL = await perpDex.getUnrealizedPnL(id);
                    const liquidationPrice = await perpDex.getLiquidationPrice(id);

                    return {
                        id: id.toString(),
                        trader: position.trader,
                        agent: position.agent,
                        pair: position.pair,
                        size: ethers.formatUnits(position.size, 18),
                        collateral: ethers.formatUnits(position.collateral, 18),
                        entryPrice: ethers.formatUnits(position.entryPrice, 18),
                        currentPrice: ethers.formatUnits(currentPrice, 18),
                        leverage: position.leverage.toString(),
                        isLong: position.isLong,
                        unrealizedPnL: ethers.formatUnits(unrealizedPnL, 18),
                        liquidationPrice: ethers.formatUnits(liquidationPrice, 18),
                        timestamp: Number(position.timestamp),
                        isOpen: position.isOpen,
                    };
                } catch (error) {
                    console.error(`Error fetching position ${id}:`, error);
                    return null;
                }
            })
        );

        // Filter out null positions
        const validPositions = positions.filter(p => p !== null);

        // Calculate totals
        const totalPnL = validPositions.reduce((sum, p) => sum + parseFloat(p!.unrealizedPnL), 0);
        const totalCollateral = validPositions.reduce((sum, p) => sum + parseFloat(p!.collateral), 0);

        return NextResponse.json({
            success: true,
            agentId,
            positions: validPositions,
            summary: {
                totalPositions: validPositions.length,
                totalPnL: totalPnL.toFixed(2),
                totalCollateral: totalCollateral.toFixed(2),
            },
            timestamp: Date.now(),
        });

    } catch (error: any) {
        console.error('Error in /api/positions/[agentId]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch positions' },
            { status: 500 }
        );
    }
}

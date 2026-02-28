export interface TradingDecision {
    id: string;
    timestamp: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    reasoning: string;
    pair: string;
    price: number;
    proof: string; // Hash or signature for verification
}

export interface Position {
    id: string;
    pair: string;
    side: 'long' | 'short';
    entryPrice: number;
    currentPrice?: number;
    exitPrice?: number;
    size: number;
    pnl?: number;
    pnlPercent?: number;
    unrealizedPnl?: number;
    unrealizedPnlPercent?: number;
}

export interface AIAgent {
    id: string;
    agentId?: number; // Added optional numerical ID
    name: string;
    description: string;
    avatar: string;
    strategy: string;
    aum: number;
    apy: number;
    trustScore: number;
    winRate: number;
    totalTrades: number;
    activePositions: Position[];
    completedPositions?: Position[];
    recentDecisions: TradingDecision[];
    history: {
        timestamp: number;
        pnl: number;
    }[];
    // Add other fields that might be used
    owner?: string;
    roi?: number;
    totalPnL?: number;
    realizedPnL?: number;
    unrealizedPnL?: number;
    totalFees?: number;
    wins?: number;
    losses?: number;
    tvl?: string;
    performance30d?: string;
    openPositions?: number;
    targetAssets?: string[];
    agentType?: string;
    riskProfile?: string;
}


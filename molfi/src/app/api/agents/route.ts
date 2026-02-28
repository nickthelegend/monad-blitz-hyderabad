
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getOraclePrice, calculatePnL } from '@/lib/marketEngine';

export async function GET() {
    try {
        // Fetch agents and all trade logs in parallel from NEW Supabase schema
        const [agentResult, tradeResult] = await Promise.all([
            supabaseAdmin.from('agents').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('trade_signals').select('*').order('created_at', { ascending: false }),
        ]);

        if (agentResult.error) throw agentResult.error;
        const agents = agentResult.data || [];
        // Map trade_signals to frontend-friendly structure if needed, or use directly
        // Assuming trade_signals has been backfilled or is being used for new trades
        const allTrades = (tradeResult.data || []).map(t => ({
            ...t,
            // Map snake_case to camelCase for existing logic compatibility
            agentId: t.agent_id,
            openedAt: t.opened_at || t.created_at,
            entryPrice: t.entry_price || '0',
            size: t.size,
            side: t.side || (t.is_long ? 'LONG' : 'SHORT'),
            pnl: t.pnl,
            fees: t.fees,
        }));

        // Fetch live prices for open positions
        const openTrades = allTrades.filter(t => t.status === 'OPEN');
        const uniquePairs = [...new Set(openTrades.map(t => t.pair))];
        const livePrices: Record<string, number> = {};

        await Promise.allSettled(
            uniquePairs.map(async (pair) => {
                try {
                    const pd = await getOraclePrice(pair);
                    livePrices[pair] = pd.price;
                } catch { /* skip */ }
            })
        );

        // Enrich with REAL data from trade logs
        const enrichedAgents = agents.map(a => {
            const agentTrades = allTrades.filter(t => t.agentId === a.agent_id);
            const closedTrades = agentTrades.filter(t => t.status === 'CLOSED');
            const agentOpenTrades = agentTrades.filter(t => t.status === 'OPEN');

            // Realized PnL
            const realizedPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
            const totalFees = agentTrades.reduce((sum, t) => sum + parseFloat(t.fees || '0'), 0);

            // Unrealized PnL from open positions
            let unrealizedPnL = 0;
            const activePositions = agentOpenTrades.map(t => {
                const currentPrice = livePrices[t.pair];
                let uPnl = 0;
                if (currentPrice) {
                    uPnl = calculatePnL(
                        t.side as 'LONG' | 'SHORT',
                        parseFloat(t.entryPrice),
                        currentPrice,
                        parseFloat(t.size)
                    );
                    unrealizedPnL += uPnl;
                }
                return {
                    ...t,
                    currentPrice: currentPrice || null,
                    unrealizedPnl: parseFloat(uPnl.toFixed(4)),
                };
            });

            // Win/Loss stats
            const wins = closedTrades.filter(t => parseFloat(t.pnl || '0') > 0);
            const winRate = closedTrades.length > 0 ? Math.round((wins.length / closedTrades.length) * 100) : 0;

            // Total PnL and equity
            const totalPnL = realizedPnL + unrealizedPnL;
            const startingEquity = 10000;
            const equity = startingEquity + totalPnL;
            const roi = ((equity - startingEquity) / startingEquity) * 100;

            // Total volume (AUM proxy)
            const totalVolume = agentTrades.reduce((sum, t) => sum + parseFloat(t.size || '0'), 0);

            // Calculate APY from ROI (annualize based on first trade date)
            let apy = 0;
            if (agentTrades.length > 0) {
                const firstTradeDate = new Date(agentTrades[agentTrades.length - 1].openedAt);
                const daysSinceFirst = Math.max(1, (Date.now() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24));
                apy = (roi / daysSinceFirst) * 365;
            }

            return {
                ...a,
                dbId: a.id,
                id: String(a.agent_id),
                agentId: a.agent_id,
                description: a.description || `${a.name} is a ${a.personality.toLowerCase()} neural agent operating on the Monad network. Optimized for high-frequency strategies.`,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${a.name}`,
                owner: a.owner_address,
                vaultAddress: a.vault_address,
                agentType: a.personality === 'Aggressive' ? 'trader' : 'fund-manager',
                riskProfile: a.personality.toLowerCase(),

                // REAL stats
                equity: parseFloat(equity.toFixed(2)),
                totalPnL: parseFloat(totalPnL.toFixed(4)),
                realizedPnL: parseFloat(realizedPnL.toFixed(4)),
                unrealizedPnL: parseFloat(unrealizedPnL.toFixed(4)),
                totalFees: parseFloat(totalFees.toFixed(4)),
                roi: parseFloat(roi.toFixed(2)),
                apy: parseFloat(apy.toFixed(1)),
                winRate,
                totalTrades: agentTrades.length,
                wins: wins.length,
                losses: closedTrades.length - wins.length,
                aum: totalVolume,
                tvl: `$${(totalVolume / 1000).toFixed(1)}K`,
                performance30d: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,

                // Live positions
                openPositions: agentOpenTrades.length,
                activePositions,
                targetAssets: [...new Set(agentTrades.map(t => t.pair?.split('/')[0]).filter(Boolean))],

                // Recent real decisions
                recentDecisions: agentTrades.slice(0, 3).map(t => ({
                    id: t.id,
                    timestamp: new Date(t.openedAt).getTime(),
                    action: t.side === 'LONG' ? 'BUY' : 'SELL',
                    reasoning: `${t.side} ${t.pair} @ $${parseFloat(t.entryPrice).toLocaleString()} with ${t.leverage}x leverage`,
                    pair: t.pair,
                    price: parseFloat(t.entryPrice),
                    proof: t.id?.slice(0, 12) || '0x...',
                })),

                apiKey: undefined, // Don't expose API key in public list
            };
        });

        return NextResponse.json({
            success: true,
            agents: enrichedAgents
        });
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

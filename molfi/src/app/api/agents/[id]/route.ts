import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getOraclePrice, calculatePnL } from '@/lib/marketEngine';

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const { id } = await params;

        // Try to find by integer agentId first, then by UUID id
        let query = supabaseAdmin.from('agents').select('*');
        if (!isNaN(parseInt(id))) {
            query = query.eq('agent_id', parseInt(id));
        } else {
            query = query.eq('id', id);
        }

        const { data: agent, error } = await query.single();
        if (error || !agent) {
            console.error(`[API] Agent not found: ${id}`, error?.message);
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
        }

        // Fetch ALL trade signals/logs for this agent
        const { data: allTradesData } = await supabaseAdmin
            .from('trade_signals')
            .select('*')
            .eq('agent_id', agent.agent_id)
            .order('opened_at', { ascending: true });

        const allTrades = (allTradesData || []).map(t => ({
            ...t,
            agentId: t.agent_id,
            openedAt: t.opened_at || t.created_at,
            entryPrice: t.entry_price || '0',
            size: t.size || '0',
            side: t.side || (t.is_long ? 'LONG' : 'SHORT'),
            pnl: t.pnl || '0',
            fees: t.fees || '0',
            status: t.status || 'CLOSED'
        }));

        const closedTrades = allTrades.filter(t => t.status === 'CLOSED');
        const openTrades = allTrades.filter(t => t.status === 'OPEN');

        // Get live prices for open positions
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

        // Realized PnL
        const realizedPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);

        // Unrealized PnL
        let unrealizedPnL = 0;
        const activePositions = openTrades.map(t => {
            const currentPrice = livePrices[t.pair];
            let uPnl = 0;
            if (currentPrice) {
                uPnl = calculatePnL(t.side as 'LONG' | 'SHORT', parseFloat(t.entryPrice), currentPrice, parseFloat(t.size));
                unrealizedPnL += uPnl;
            }
            return {
                ...t,
                currentPrice,
                unrealizedPnl: parseFloat(uPnl.toFixed(4)),
                unrealizedPnlPercent: parseFloat(t.size) > 0 ? parseFloat(((uPnl / parseFloat(t.size)) * 100).toFixed(2)) : 0
            };
        });

        const totalPnL = realizedPnL + unrealizedPnL;
        const startingEquity = 10000;
        const currentEquityValue = startingEquity + totalPnL;
        const roi = ((currentEquityValue - startingEquity) / startingEquity) * 100;

        // Build equity curve
        let runningEquity = startingEquity;
        const equityCurve = [{ time: Math.floor(new Date(agent.created_at).getTime() / 1000), value: runningEquity }];
        closedTrades.forEach(t => {
            runningEquity += parseFloat(t.pnl || '0');
            equityCurve.push({
                time: Math.floor(new Date(t.closed_at || t.opened_at).getTime() / 1000),
                value: parseFloat(runningEquity.toFixed(2))
            });
        });

        if (openTrades.length > 0 || equityCurve.length === 1) {
            equityCurve.push({
                time: Math.floor(Date.now() / 1000),
                value: parseFloat(currentEquityValue.toFixed(2))
            });
        }

        return NextResponse.json({
            success: true,
            agent: {
                ...agent,
                agentId: agent.agent_id,
                id: String(agent.agent_id),
                owner: agent.owner_address,
                vaultAddress: agent.vault_address,
                equityCurve,
                totalPnL: parseFloat(totalPnL.toFixed(4)),
                realizedPnL: parseFloat(realizedPnL.toFixed(4)),
                unrealizedPnL: parseFloat(unrealizedPnL.toFixed(4)),
                roi: parseFloat(roi.toFixed(2)),
                winRate: closedTrades.length > 0 ? Math.round((closedTrades.filter(t => parseFloat(t.pnl || '0') > 0).length / closedTrades.length) * 100) : 0,
                totalTrades: allTrades.length,
                activePositions,
                completedPositions: closedTrades.map(t => ({
                    ...t,
                    pnl: parseFloat(parseFloat(t.pnl || '0').toFixed(4)),
                    pnlPercent: t.size && parseFloat(t.size) > 0 ? parseFloat(((parseFloat(t.pnl || '0') / parseFloat(t.size)) * 100).toFixed(2)) : 0
                })).reverse(),
            }
        });
    } catch (error: any) {
        console.error('Error fetching agent detail:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


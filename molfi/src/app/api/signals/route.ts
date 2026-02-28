import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    try {
        const { data: signals, error } = await supabaseAdmin
            .from('TradeSignal')
            .select(`
                *,
                agent:AIAgent(*)
            `)
            .eq('status', 'PENDING')
            .order('createdAt', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: signals?.length || 0,
            signals: (signals || []).map((s: any) => ({
                id: s.id,
                agentId: s.agentId,
                agentName: s.agent.name,
                vaultAddress: s.agent.vaultAddress,
                pair: s.pair,
                size: s.size,
                collateral: s.collateral,
                leverage: s.leverage,
                isLong: s.isLong,
                createdAt: s.createdAt
            }))
        });
    } catch (error: any) {
        console.error('Error fetching trade signals:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

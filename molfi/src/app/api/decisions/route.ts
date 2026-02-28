import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
        }
        const { agentId, pair, size, collateral, leverage, isLong } = body;

        // Verify agent exists
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('AIAgent')
            .select('name')
            .eq('agentId', parseInt(agentId))
            .single();

        if (agentError || !agent) {
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
        }

        const { data: signal, error: signalError } = await supabaseAdmin
            .from('TradeSignal')
            .insert({
                agentId: parseInt(agentId),
                pair: pair || 'BTC/USDT',
                size: parseFloat(size),
                collateral: parseFloat(collateral),
                leverage: parseInt(leverage),
                isLong: !!isLong,
                status: 'PENDING'
            })
            .select()
            .single();

        if (signalError) throw signalError;

        console.log(`[AI_DECISION] Agent ${agent.name} (${agentId}) issued ${isLong ? 'LONG' : 'SHORT'} on ${pair}`);

        return NextResponse.json({
            success: true,
            signalId: signal.id,
            message: 'Neural decision transmitted to ClawBot bridge'
        });
    } catch (error: any) {
        console.error('Error creating trade decision:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

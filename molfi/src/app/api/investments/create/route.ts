
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { txHash, agentId, userAddress, amount, shares } = body;

        // Ensure agentId is a number for bigint column mapping
        const numericAgentId = parseInt(agentId);

        if (!txHash || isNaN(numericAgentId) || !userAddress || !amount || !shares) {
            return NextResponse.json({ success: false, error: 'Missing or invalid required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('investments')
            .upsert(
                {
                    tx_hash: txHash,
                    agent_id: numericAgentId,
                    user_address: userAddress,
                    amount,
                    shares,
                    status: 'ACTIVE'
                },
                { onConflict: 'tx_hash' }
            )
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating investment:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, investment: data });
    } catch (error: any) {
        console.error('Error creating investment:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

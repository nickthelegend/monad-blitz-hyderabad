
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const { userAddress, agentId, txHash, isFullWithdraw } = await req.json();

        if (!userAddress || !agentId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // If it's a full withdraw, mark all active investments for this agent as CLOSED
        if (isFullWithdraw) {
            console.log(`[SyncWithdrawal] Marking investments as CLOSED for user ${userAddress} on agent ${agentId}`);
            const { error } = await supabaseAdmin
                .from('investments')
                .update({ status: 'CLOSED' })
                .ilike('user_address', userAddress)
                .eq('agent_id', agentId)
                .eq('status', 'ACTIVE');

            if (error) {
                console.error('Supabase error updating investment status:', error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
        }

        // We could also record a withdrawal log here if we had a dedicated table.
        // For now, syncing the CLOSED status is the primary requirement.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in sync-withdrawal API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

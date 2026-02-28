
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const owner = searchParams.get('owner');

        if (!owner) {
            return NextResponse.json({ success: false, error: 'Owner address required' }, { status: 400 });
        }

        // Fetch from updated agents table
        const { data: agents, error } = await supabaseAdmin
            .from('agents')
            .select('*')
            .eq('owner_address', owner)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map snake_case DB fields to camelCase frontend interface
        const enrichedAgents = (agents || []).map(a => ({
            id: String(a.agent_id),
            agentId: a.agent_id,
            name: a.name,
            personality: a.personality,
            strategy: a.strategy || 'Neural Momentum',
            description: a.description || `${a.name} is a ${a.personality?.toLowerCase() || 'balanced'} neural agent.`,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${a.name}`,
            owner: a.owner_address,
            vaultAddress: a.vault_address, // Map for frontend
            apiKey: a.api_key, // Map for frontend
            createdAt: a.created_at,

            // Additional UI fields
            agentType: a.personality === 'Aggressive' ? 'trader' : 'fund-manager',
            riskProfile: a.personality?.toLowerCase() || 'balanced',
            reputationScore: 90,
            tvl: '$0.0M', // New agents start empty
            performance30d: '0.0%',
            targetAssets: ['ETH', 'BTC', 'SOL', 'MON'],
        }));

        return NextResponse.json({
            success: true,
            agents: enrichedAgents
        });
    } catch (error: any) {
        console.error('Error fetching my agents:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

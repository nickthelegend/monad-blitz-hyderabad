
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
    return `molfi_${crypto.randomBytes(32).toString('hex')}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, personality, ownerAddress, strategy, description, agentId } = body;

        // Validation
        if (!name || !ownerAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: name, ownerAddress' },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        // Get next agent ID from NEW table
        const { data: maxAgent } = await supabaseAdmin
            .from('agents')
            .select('agent_id')
            .order('agent_id', { ascending: false })
            .limit(1)
            .single();

        const nextAgentId = agentId ? Number(agentId) : (Number(maxAgent?.agent_id) || 0) + 1;

        // Generate API key
        const apiKey = generateApiKey();

        // Generate a mock vault address (in production this would be an actual deployed vault)
        const vaultAddress = '0x' + crypto.randomBytes(20).toString('hex');

        // Insert agent into NEW database table
        const { data: agent, error } = await supabaseAdmin
            .from('agents')
            .insert({
                agent_id: nextAgentId,
                name: name,
                personality: personality || 'Balanced',
                owner_address: ownerAddress,
                vault_address: vaultAddress,
                api_key: apiKey,
                strategy: strategy || 'Neural Momentum',
                description: description || '',
            })
            .select()
            .single();

        if (error) {
            console.error('Agent registration error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            agent: {
                agentId: nextAgentId,
                name: name,
                personality: personality || 'Balanced',
                vaultAddress: vaultAddress,
                ownerAddress: ownerAddress,
            },
            apiKey: apiKey,
            skillUrl: 'https://molfi.fun/skill.md',
            message: `Agent "${name}" registered successfully. Use the API key to connect your agent. Read https://molfi.fun/skill.md for integration instructions.`,
        });
    } catch (error: any) {
        console.error('Error registering agent:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to register agent' },
            { status: 500 }
        );
    }
}

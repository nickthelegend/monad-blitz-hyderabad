import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST() {
    try {
        const { data: agent, error } = await supabaseAdmin
            .from('AIAgent')
            .upsert({
                agentId: 1,
                name: 'ClawAlpha-01',
                personality: 'Aggressive',
                vaultAddress: '0x' + Math.random().toString(16).slice(2, 42),
                ownerAddress: '0x' + Math.random().toString(16).slice(2, 42)
            }, {
                onConflict: 'agentId'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Neural Seed successful',
            agent: agent
        });
    } catch (error: any) {
        console.error('Error seeding agent:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

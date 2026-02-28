
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    try {
        const { data: investments, error } = await supabaseAdmin
            .from('investments')
            .select(`
                *,
                agents (
                    name,
                    vault_address,
                    agent_id
                )
            `)
            .ilike('user_address', address)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, investments });
    } catch (error: any) {
        console.error('Error fetching user investments:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const { data: managers, error } = await supabaseAdmin
      .from('FundManager')
      .select('*')
      .order('totalRoi', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: managers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, systemPrompt, riskLevel, avatarUrl } = body;

    const { data: manager, error } = await supabaseAdmin
      .from('FundManager')
      .insert({
        name,
        description,
        systemPrompt,
        riskLevel: riskLevel || 'BALANCED',
        avatarUrl,
        totalRoi: 0,
        totalAum: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-create a Vault for this manager
    await supabaseAdmin.from('Vault').insert({
      managerId: manager.id,
      name: `${name} Alpha Vault`,
      tvl: 0,
      sharePrice: 1.0,
      status: 'ACTIVE'
    });

    return NextResponse.json({ success: true, data: manager });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { signalId, status, txHash } = body;

    if (!signalId || !status) {
      return NextResponse.json({ success: false, error: 'Missing signalId or status' }, { status: 400 });
    }

    const { data: updatedSignal, error } = await supabaseAdmin
      .from('TradeSignal')
      .update({
        status: status, // 'EXECUTED' or 'FAILED'
        txHash: txHash,
        executedAt: new Date()
      })
      .eq('id', signalId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[CLAW_EXECUTION] Signal ${signalId} updated to ${status}. TX: ${txHash || 'N/A'}`);

    return NextResponse.json({
      success: true,
      signal: updatedSignal
    });
  } catch (error: any) {
    console.error('Error updating position status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

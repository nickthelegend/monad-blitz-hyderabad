
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getOraclePrice } from '@/lib/marketEngine';
import { recordDecision, generateProofHash } from '@/lib/reputationService';

/**
 * POST /api/agent/decide
 * Records an AI agent's trading decision with on-chain Proof of Trade.
 * 
 * Body: { apiKey, agentId, action, pair, reasoning, confidence }
 * 
 * Flow:
 *   1. Authenticate agent via API key
 *   2. Fetch current market price for the pair
 *   3. Log the decision to Supabase (agent_decisions table)
 *   4. Submit reputation feedback on-chain (Proof of Trade)
 *   5. Return decision details with proof hash + tx hash
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, agentId, action, pair, reasoning, confidence } = body;

    // --- Auth: Validate API Key ---
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required. Pass "apiKey" in request body.' }, { status: 401 });
    }

    // Auth against NEW agents table
    const { data: agent, error: authError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (authError || !agent) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Use provided agentId or fall back to authenticated agent's ID
    const resolvedAgentId = agentId || agent.agent_id;

    // Verify agent owns this agentId
    if (String(resolvedAgentId) !== String(agent.agent_id)) {
      return NextResponse.json({ error: 'Agent ID mismatch' }, { status: 403 });
    }

    // --- Validation ---
    if (!action || !pair) {
      return NextResponse.json({ error: 'Missing required fields: action, pair' }, { status: 400 });
    }

    const validActions = ['BUY', 'SELL', 'HOLD'];
    const normalizedAction = action.toUpperCase();
    if (!validActions.includes(normalizedAction)) {
      return NextResponse.json({ error: `Invalid action: ${action}. Must be one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    const normalizedPair = pair.replace('-', '/').toUpperCase();
    const conf = Math.min(Math.max(parseFloat(confidence) || 0.5, 0), 1);

    // --- Get Current Market Price ---
    let currentPrice = 0;
    try {
      const priceData = await getOraclePrice(normalizedPair);
      currentPrice = priceData.price;
    } catch {
      currentPrice = 0; // Non-critical — we log the decision regardless
    }

    // --- Generate proof hash ---
    const proofHash = generateProofHash({
      agentId: resolvedAgentId,
      action: 'DECISION',
      pair: normalizedPair,
      value: Math.round(conf * 100),
      decimals: 0,
      metadata: {
        tradeAction: normalizedAction,
        reasoning: reasoning || '',
        confidence: conf,
        price: currentPrice,
      },
    });

    // --- Log Decision to Supabase (NEW TABLE) ---
    const { data: signal, error: insertError } = await supabaseAdmin
      .from('agent_decisions')
      .insert({
        agent_id: resolvedAgentId,
        action: normalizedAction,
        pair: normalizedPair,
        confidence: conf,
        reasoning: reasoning || `Agent decision: ${normalizedAction} ${normalizedPair}`,
        price: currentPrice,
        proof_hash: proofHash,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Decision insert error:', insertError);
      // Non-critical — continue even if Supabase insert fails
    }

    console.log(`[DECISION] Agent ${agent.name} (#${resolvedAgentId}) → ${normalizedAction} ${normalizedPair} @ $${currentPrice.toFixed(2)} | Confidence: ${(conf * 100).toFixed(0)}%`);

    // --- Submit On-Chain Reputation (Proof of Trade) ---
    const reputation = await recordDecision({
      agentId: resolvedAgentId,
      agentName: agent.name,
      action: normalizedAction,
      pair: normalizedPair,
      reasoning: reasoning || '',
      confidence: conf,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: resolvedAgentId,
        name: agent.name,
      },
      decision: {
        action: normalizedAction,
        pair: normalizedPair,
        confidence: conf,
        reasoning: reasoning || '',
        price: currentPrice,
      },
      proof: {
        hash: reputation.proofHash,
        txHash: reputation.txHash || null,
        onChain: reputation.success,
      },
      signal: signal ? { id: signal.id } : null,
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('Error in /api/agent/decide:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record decision' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase-server';
import { syncOraclePrice, calculatePnL } from '@/lib/marketEngine';
import { recordTradeClose } from '@/lib/reputationService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiKey, tradeId } = body;

        // --- Auth: Validate API Key ---
        if (!apiKey) {
            return NextResponse.json({ error: 'API key required' }, { status: 401 });
        }

        const { data: agent, error: authError } = await supabaseAdmin
            .from('agents')
            .select('*')
            .eq('api_key', apiKey)
            .single();

        if (authError || !agent) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        // --- Validation ---
        if (!tradeId) {
            return NextResponse.json({ error: 'tradeId is required' }, { status: 400 });
        }

        // --- Get the open trade ---
        const { data: trade, error: fetchError } = await supabaseAdmin
            .from('trade_signals')
            .select('*')
            .eq('id', tradeId)
            .eq('agent_id', agent.agent_id)
            .single();

        if (fetchError || !trade) {
            return NextResponse.json({ error: 'Trade not found or does not belong to this agent' }, { status: 404 });
        }

        if (trade.status !== 'OPEN') {
            return NextResponse.json({ error: `Trade is already ${trade.status}` }, { status: 400 });
        }

        const tradeSize = parseFloat(trade.size || '0');
        const entryPrice = parseFloat(trade.entry_price || trade.entryPrice || '0');

        // --- Get Current Price (JIT sync to oracle) ---
        const priceData = await syncOraclePrice(trade.pair);
        const exitPrice = priceData.price;

        // --- Calculate PnL ---
        const pnl = calculatePnL(
            (trade.side || (trade.is_long ? 'LONG' : 'SHORT')) as 'LONG' | 'SHORT',
            entryPrice,
            exitPrice,
            tradeSize
        );

        const closingFee = tradeSize * 0.001; // 0.1%
        const existingFees = parseFloat(trade.fees || '0');
        const netPnl = pnl - closingFee - existingFees;

        // --- ON-CHAIN EXECUTION: Close Perp Position ---
        let onChainData = { success: false, txHash: null };

        const vaultAddr = agent.vault_address || agent.vaultAddress;
        if (vaultAddr) {
            try {
                const RPC_URL = 'https://testnet-rpc.monad.xyz';
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '', provider);

                // 1. Get Vault and DEX
                const vault = new ethers.Contract(
                    vaultAddr,
                    [
                        "function closePerpPosition(uint256) external",
                        "function perpDEX() public view returns (address)"
                    ],
                    wallet
                );

                const dexAddress = await vault.perpDEX();
                const dex = new ethers.Contract(
                    dexAddress,
                    [
                        "function getAgentPositions(address) external view returns (uint256[])",
                        "function getPosition(uint256) external view returns (tuple(uint256 id, address trader, address agent, string pair, uint256 size, uint256 collateral, uint256 entryPrice, uint256 leverage, bool isLong, uint256 timestamp, int256 fundingIndex, bool isOpen))"
                    ],
                    provider
                );

                // 2. Find the on-chain position ID
                const positionIds = await dex.getAgentPositions(vaultAddr);
                let targetPositionId = null;

                console.log(`[ON-CHAIN] Searching for position to close for Agent #${agent.agent_id} (${trade.pair})...`);

                // Search from newest to oldest
                for (let i = positionIds.length - 1; i >= 0; i--) {
                    const posId = positionIds[i];
                    const pos = await dex.getPosition(posId);

                    const tradeIsLong = trade.side === 'LONG' || trade.is_long === true;
                    const isCorrectSide = (tradeIsLong && pos.isLong) || (!tradeIsLong && !pos.isLong);

                    if (pos.isOpen && pos.pair === trade.pair && isCorrectSide) {
                        targetPositionId = posId;
                        break;
                    }
                }

                if (targetPositionId !== null) {
                    console.log(`[ON-CHAIN] Found matching position: ${targetPositionId}. Sending close tx...`);
                    const tx = await vault.closePerpPosition(targetPositionId, { gasLimit: 500000 });
                    console.log(`[ON-CHAIN] Close TX Sent: ${tx.hash}`);
                    await tx.wait(1);

                    onChainData = {
                        success: true,
                        txHash: tx.hash
                    };
                    console.log(`[ON-CHAIN] Position Closed ✅ tx: ${tx.hash}`);
                } else {
                    console.warn(`[ON-CHAIN] No matching open position found for agent #${agent.agent_id} on ${trade.pair}`);
                }
            } catch (err: any) {
                console.error('[ON-CHAIN] Close execution failed:', err.message);
            }
        }

        // --- Update Trade in Supabase ---
        const { data: closedTrade, error: updateError } = await supabaseAdmin
            .from('trade_signals')
            .update({
                exit_price: exitPrice,
                pnl: parseFloat(netPnl.toFixed(4)),
                fees: existingFees + closingFee,
                status: 'CLOSED',
                closed_at: new Date().toISOString(),
            })
            .eq('id', tradeId)
            .select()
            .single();

        if (updateError) {
            throw new Error('Failed to close trade: ' + updateError.message);
        }

        const tradeOpenedAt = trade.opened_at || trade.openedAt || trade.created_at;
        const tradeDuration = Date.now() - new Date(tradeOpenedAt).getTime();
        console.log(`[TRADE_CLOSE] Agent ${agent.name} (#${agent.agent_id}) closed trade | PnL: ${netPnl > 0 ? '+' : ''}$${netPnl.toFixed(4)}`);

        // Submit on-chain reputation
        const reputation = await recordTradeClose({
            agentId: agent.agent_id,
            agentName: agent.name,
            pair: trade.pair,
            side: trade.side || (trade.is_long ? 'LONG' : 'SHORT'),
            entryPrice: entryPrice,
            exitPrice,
            pnl: parseFloat(netPnl.toFixed(4)),
            tradeId: trade.id,
            duration: tradeDuration,
        });

        return NextResponse.json({
            success: true,
            agent: {
                id: agent.agent_id,
                name: agent.name,
            },
            trade: {
                tradeId: trade.id,
                pair: trade.pair,
                pnl: parseFloat(netPnl.toFixed(4)),
                status: 'CLOSED',
                closeTxHash: onChainData.txHash,
            },
            reputation: {
                hash: reputation.proofHash,
                txHash: reputation.txHash || null,
                onChain: reputation.success,
            },
            timestamp: Date.now(),
        });

    } catch (error: any) {
        console.error('Error in /api/trade/close:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to close trade' },
            { status: 500 }
        );
    }
}


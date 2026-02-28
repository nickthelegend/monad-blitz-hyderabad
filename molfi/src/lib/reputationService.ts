/**
 * MolFi On-Chain Reputation Service
 * ═══════════════════════════════════════════════════════════════
 * Sends reputation feedback to the ReputationRegistry contract
 * whenever an agent takes a decision, opens, or closes a trade.
 *
 * Uses the deployer wallet to submit feedback on behalf of the protocol.
 * Each feedback entry includes:
 *   - value: numeric score (PnL for closes, confidence for decisions)
 *   - tag1: action type (TRADE_OPEN, TRADE_CLOSE, DECISION)
 *   - tag2: trading pair
 *   - feedbackURI: JSON-encoded metadata
 *   - feedbackHash: SHA-256 proof hash of the action
 */

import { ethers } from 'ethers';
import { createHash } from 'crypto';

// ── Contract ABI (write subset) ──────────────────────────────────
const REPUTATION_ABI = [
    'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external',
    'function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64)',
];

// ── Configuration ────────────────────────────────────────────────
const REPUTATION_REGISTRY = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '';
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

const RPC_URLS = [
    'https://testnet-rpc.monad.xyz',
    'https://monad-testnet.drpc.org',
];

// ── Types ────────────────────────────────────────────────────────
export type ReputationAction = 'TRADE_OPEN' | 'TRADE_CLOSE' | 'DECISION';

export interface ReputationEntry {
    agentId: number;
    action: ReputationAction;
    pair: string;
    value: number;       // PnL for closes, confidence*100 for decisions, size for opens
    decimals: number;    // Decimal places for the value
    metadata: Record<string, any>;  // Full trade/decision details
}

export interface ReputationResult {
    success: boolean;
    txHash?: string;
    proofHash: string;
    error?: string;
}

// ── Proof Hash Generation ────────────────────────────────────────
/**
 * Generates a SHA-256 proof hash for any agent action.
 * This hash is stored on-chain and can be used to verify the action.
 */
export function generateProofHash(entry: ReputationEntry): string {
    const payload = JSON.stringify({
        agentId: entry.agentId,
        action: entry.action,
        pair: entry.pair,
        value: entry.value,
        timestamp: Math.floor(Date.now() / 1000),
        metadata: entry.metadata,
    });

    return '0x' + createHash('sha256').update(payload).digest('hex');
}

// ── Provider Management ──────────────────────────────────────────
let providerIdx = 0;

function getWallet(): ethers.Wallet | null {
    if (!DEPLOYER_KEY || !REPUTATION_REGISTRY) {
        console.warn('[Reputation] Missing DEPLOYER_PRIVATE_KEY or REPUTATION_REGISTRY');
        return null;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URLS[providerIdx % RPC_URLS.length]);
    return new ethers.Wallet(DEPLOYER_KEY, provider);
}

function rotateProvider() {
    providerIdx = (providerIdx + 1) % RPC_URLS.length;
}

// ── Core: Submit Reputation On-Chain ─────────────────────────────
/**
 * Submits reputation feedback to the ReputationRegistry contract.
 * This is fire-and-forget — errors are logged but don't block the trade.
 */
export async function submitReputation(entry: ReputationEntry): Promise<ReputationResult> {
    const proofHash = generateProofHash(entry);

    // Convert numeric value to int128 with specified decimals
    const scaledValue = Math.round(entry.value * (10 ** entry.decimals));
    const int128Value = BigInt(scaledValue);

    // Build the feedback URI (metadata JSON)
    const feedbackURI = JSON.stringify({
        action: entry.action,
        pair: entry.pair,
        timestamp: new Date().toISOString(),
        ...entry.metadata,
    });

    // Try to submit on-chain
    for (let attempt = 0; attempt < RPC_URLS.length; attempt++) {
        const wallet = getWallet();
        if (!wallet) {
            return { success: false, proofHash, error: 'No wallet configured' };
        }

        try {
            const contract = new ethers.Contract(REPUTATION_REGISTRY, REPUTATION_ABI, wallet);

            // Pre-check: Self-feedback registry check to avoid revert
            try {
                const identityAddr = await contract.getIdentityRegistry();
                const identity = new ethers.Contract(identityAddr, ['function isAuthorizedOrOwner(address, uint256) external view returns (bool)'], wallet.provider);
                const isSelf = await identity.isAuthorizedOrOwner(wallet.address, entry.agentId);

                if (isSelf) {
                    console.warn(`[Reputation] Skip: Self-feedback not allowed for agent #${entry.agentId} (Deployer is owner)`);
                    return { success: false, proofHash, error: 'Self-feedback not allowed' };
                }
            } catch (checkErr) { /* fallback to try-catch the actual TX */ }

            console.log(`[Reputation] Submitting ${entry.action} for agent #${entry.agentId} (${entry.pair})...`);

            const tx = await contract.giveFeedback(
                entry.agentId,           // agentId
                int128Value,             // value (scaled by decimals)
                entry.decimals,          // valueDecimals
                entry.action,            // tag1 = action type
                entry.pair,              // tag2 = trading pair
                'molfi.fun',             // endpoint
                feedbackURI,             // feedbackURI
                proofHash,               // feedbackHash (SHA-256 proof)
                { gasLimit: 500000 }
            );

            console.log(`[Reputation] TX sent: ${tx.hash}`);

            // Don't wait for confirmation to avoid blocking the API response
            tx.wait(1).then(() => {
                console.log(`[Reputation] ✅ Confirmed: ${entry.action} for agent #${entry.agentId} | tx: ${tx.hash}`);
            }).catch((err: any) => {
                const isRevert = err.message?.includes('reverted') || err.message?.includes('CALL_EXCEPTION');
                if (isRevert) {
                    console.warn(`[Reputation] ⚠️ TX reverted on-chain (likely duplicate feedbackHash or state change): ${tx.hash}`);
                } else {
                    console.error(`[Reputation] ⚠️ TX failed to confirm: ${err.message}`);
                }
            });

            return {
                success: true,
                txHash: tx.hash,
                proofHash,
            };
        } catch (err: any) {
            console.error(`[Reputation] Attempt ${attempt + 1} failed: ${err.message}`);

            // Check for "Self-feedback not allowed" — this means the deployer
            // is the owner of the agent. We can't submit from the same wallet.
            if (err.message?.includes('Self-feedback')) {
                console.warn(`[Reputation] Cannot submit self-feedback for agent #${entry.agentId}. Deployer is the agent owner.`);
                return { success: false, proofHash, error: 'Self-feedback not allowed — deployer is agent owner' };
            }

            rotateProvider();
        }
    }

    return { success: false, proofHash, error: 'All RPC attempts failed' };
}

// ── Convenience Methods ──────────────────────────────────────────

/**
 * Submit reputation for a trade open event
 */
export async function recordTradeOpen(params: {
    agentId: number;
    agentName: string;
    pair: string;
    side: string;
    size: number;
    leverage: number;
    entryPrice: number;
    tradeId: string | number;
}): Promise<ReputationResult> {
    return submitReputation({
        agentId: params.agentId,
        action: 'TRADE_OPEN',
        pair: params.pair,
        value: params.size,
        decimals: 4,
        metadata: {
            agentName: params.agentName,
            side: params.side,
            size: params.size,
            leverage: params.leverage,
            entryPrice: params.entryPrice,
            tradeId: params.tradeId,
        },
    });
}

/**
 * Submit reputation for a trade close event (includes PnL)
 */
export async function recordTradeClose(params: {
    agentId: number;
    agentName: string;
    pair: string;
    side: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    tradeId: string | number;
    duration: number;
}): Promise<ReputationResult> {
    return submitReputation({
        agentId: params.agentId,
        action: 'TRADE_CLOSE',
        pair: params.pair,
        value: params.pnl,        // PnL as the reputation value — positive = good, negative = bad
        decimals: 4,
        metadata: {
            agentName: params.agentName,
            side: params.side,
            entryPrice: params.entryPrice,
            exitPrice: params.exitPrice,
            pnl: params.pnl,
            tradeId: params.tradeId,
            duration: params.duration,
        },
    });
}

/**
 * Submit reputation for an agent decision event
 */
export async function recordDecision(params: {
    agentId: number;
    agentName: string;
    action: string;   // BUY, SELL, HOLD
    pair: string;
    reasoning: string;
    confidence: number;  // 0-1
}): Promise<ReputationResult> {
    // Convert confidence to a score (0-100)
    const score = Math.round(params.confidence * 100);

    return submitReputation({
        agentId: params.agentId,
        action: 'DECISION',
        pair: params.pair,
        value: score,
        decimals: 0,
        metadata: {
            agentName: params.agentName,
            tradeAction: params.action,
            reasoning: params.reasoning,
            confidence: params.confidence,
        },
    });
}

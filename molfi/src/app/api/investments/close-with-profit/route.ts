
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase-server';
import MolfiAgentVaultABI from '@/abis/MolfiAgentVault.json';

export async function POST(req: Request) {
    try {
        const { userAddress, agentId, vaultAddress } = await req.json();

        if (!userAddress || !agentId || !vaultAddress) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[PayoutAPI] Starting CloseWithProfit for user ${userAddress} on agent ${agentId}`);

        // 1. Get Active Investments from Supabase to calculate principal
        const { data: dbInvestments, error: dbError } = await supabaseAdmin
            .from('investments')
            .select('*')
            .match({ user_address: userAddress, agent_id: agentId, status: 'ACTIVE' });

        if (dbError) throw dbError;

        const totalPrincipal = dbInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        console.log(`[PayoutAPI] Total Principal calculated: ${totalPrincipal} USDC`);

        // 2. Connect to the Vault
        const RPC_URL = 'https://testnet-rpc.monad.xyz';
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '', provider);
        const vault = new ethers.Contract(vaultAddress, MolfiAgentVaultABI, wallet);

        // 3. Get User's On-Chain State
        const shareBalance = await vault.balanceOf(userAddress);
        if (shareBalance === 0n) {
            return NextResponse.json({ success: false, error: 'User has no shares in vault' }, { status: 400 });
        }

        const currentValueWei = await vault.convertToAssets(shareBalance);
        const currentValue = parseFloat(ethers.formatEther(currentValueWei));

        console.log(`[PayoutAPI] On-chain Current Value: ${currentValue} USDC`);

        // 4. Calculate Payout (Profit Only)
        // Note: If currentValue < principal, the user has lost money. 
        // According to user request: "i only need to give the profits".
        // So principal stays in the vault.
        const profit = currentValue > totalPrincipal ? currentValue - totalPrincipal : 0;
        const profitWei = ethers.parseEther(profit.toFixed(6));

        console.log(`[PayoutAPI] Calculated Profit Payout: ${profit} USDC`);

        // 5. Execute On-Chain Transaction using Deployer Secret
        console.log(`[PayoutAPI] Executing adminPayoutProfit on-chain...`);
        const tx = await vault.adminPayoutProfit(userAddress, shareBalance, profitWei);
        console.log(`[PayoutAPI] TX Sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[PayoutAPI] TX Confirmed ✅`);

        // 6. Update Supabase to mark as CLOSED
        const { error: updateError } = await supabaseAdmin
            .from('investments')
            .update({ status: 'CLOSED' })
            .ilike('user_address', userAddress)
            .eq('agent_id', agentId)
            .eq('status', 'ACTIVE');

        if (updateError) {
            console.error('[PayoutAPI] Supabase update failed:', updateError);
        }

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            payoutAmount: profit,
            principalKept: totalPrincipal
        });

    } catch (error: any) {
        console.error('[PayoutAPI] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

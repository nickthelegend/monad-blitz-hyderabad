
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC;
const RPC_URL = 'https://testnet-rpc.monad.xyz';

const USDC_ABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) view returns (uint256)"
];

export async function POST(req: Request) {
    try {
        const { address } = await req.json();

        if (!address) {
            return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
        }

        if (!process.env.DEPLOYER_PRIVATE_KEY) {
            return NextResponse.json({ success: false, error: 'Deployer key not configured' }, { status: 500 });
        }

        console.log(`[FaucetAPI] Minting 10,000 mUSD for ${address}...`);

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
        const usdc = new ethers.Contract(USDC_ADDRESS || '', USDC_ABI, wallet);

        // Mint 10,000 USDC (18 decimals for this mock)
        const amount = ethers.parseUnits('10000', 18);

        const tx = await usdc.mint(address, amount);
        console.log(`[FaucetAPI] TX Sent: ${tx.hash}`);

        await tx.wait();
        console.log(`[FaucetAPI] TX Confirmed ✅`);

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            amount: '10000'
        });

    } catch (error: any) {
        console.error('[FaucetAPI] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

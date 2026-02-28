import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const MUSD_ADDRESS = process.env.NEXT_PUBLIC_USDC!;
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY!;
const RPC_URL = "https://testnet-rpc.monad.xyz";

const MUSD_ABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) view returns (uint256)",
];

// Simple in-memory rate limit: 1 claim per address per 60 seconds
const lastClaim = new Map<string, number>();
const COOLDOWN_MS = 60_000;

export async function POST(req: NextRequest) {
    try {
        const { address } = await req.json();

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
        }

        // Rate limit check
        const now = Date.now();
        const last = lastClaim.get(address.toLowerCase());
        if (last && now - last < COOLDOWN_MS) {
            const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
            return NextResponse.json(
                { error: `Please wait ${wait}s before claiming again` },
                { status: 429 }
            );
        }

        // Connect to RPC with deployer wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(DEPLOYER_PK, provider);
        const contract = new ethers.Contract(MUSD_ADDRESS, MUSD_ABI, wallet);

        // Mint 1000 mUSD.dev (18 decimals)
        const amount = ethers.parseUnits("1000", 18);
        const tx = await contract.mint(address, amount);
        const receipt = await tx.wait();

        // Record claim time
        lastClaim.set(address.toLowerCase(), Date.now());

        return NextResponse.json({
            success: true,
            txHash: receipt.hash,
            amount: "1000",
        });
    } catch (err: any) {
        console.error("Faucet mint error:", err);
        return NextResponse.json(
            { error: err.shortMessage || err.message || "Minting failed" },
            { status: 500 }
        );
    }
}

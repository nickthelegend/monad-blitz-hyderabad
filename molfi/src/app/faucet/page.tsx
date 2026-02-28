"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
    Zap,
    ShieldCheck,
    Loader2,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ExternalLink
} from "lucide-react";

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC as `0x${string}`;
const USDC_ABI = [
    { "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }
] as const;

export default function FaucetPage() {
    const { address, isConnected } = useAccount();
    const [isMinting, setIsMinting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    });

    const { data: decimals } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "decimals",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const requestTokens = async () => {
        if (!address) return;

        setIsMinting(true);
        setError(null);
        setSuccess(false);
        setTxHash(null);

        try {
            const res = await fetch("/api/faucet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Minting failed");
            }

            setTxHash(data.txHash);
            setSuccess(true);

            // Refresh balance after a short delay
            setTimeout(() => refetchBalance(), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to request tokens. Please try again.");
        } finally {
            setIsMinting(false);
        }
    };

    if (!mounted) return null;

    const formattedBalance = balance !== undefined
        ? Number(formatUnits(balance, decimals || 18)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : "0.0";

    const shortenAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="faucet-page">
            <div className="grid-overlay" />

            <div className="container main-content-faucet">
                <header className="faucet-header text-center animate-in">
                    <h1 className="faucet-title">FAUCET</h1>
                    <p className="faucet-subtitle">
                        Get test mUSD.dev for the Monad ecosystem.
                    </p>
                </header>

                <div className="faucet-card animate-in">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">

                            <div className="flex flex-col justify-center">
                                <h3 className="header-label">mUSD.dev</h3>
                                <p className="header-sublabel">MONAD TESTNET</p>
                            </div>
                        </div>
                        <div className="verified-badge">
                            <ShieldCheck size={12} />
                            <span>VERIFIED</span>
                        </div>
                    </div>

                    <div className="stats-list">
                        <div className="stat-row">
                            <span className="stat-label">Wallet</span>
                            <span className="stat-value">
                                {isConnected ? shortenAddr(address!) : "Not Connected"}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Balance</span>
                            <span className="stat-value highlight">{formattedBalance} mUSD.dev</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Amount</span>
                            <span className="stat-value">1,000.00</span>
                        </div>
                    </div>

                    <button
                        className={`request-btn ${isMinting ? 'loading' : ''} ${success ? 'success' : ''}`}
                        onClick={requestTokens}
                        disabled={isMinting || !isConnected}
                    >
                        {isMinting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>MINTING...</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={16} />
                                <span>DISTRIBUTED</span>
                            </>
                        ) : (
                            <>
                                <span>REQUEST TOKENS</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="error-box animate-in">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {txHash && success && (
                        <div className="success-footer animate-in">
                            <a
                                href={`https://monad-testnet.socialscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="explorer-link"
                            >
                                View Transaction <ExternalLink size={10} />
                            </a>
                        </div>
                    )}
                </div>

                <footer className="faucet-footer animate-in">
                    <span>Gasless Distribution</span>
                </footer>
            </div>

            <style jsx>{`
                .faucet-page {
                    min-height: 100vh;
                    background: #050508;
                    color: white;
                    padding-bottom: 5rem;
                    position: relative;
                    overflow: hidden;
                }

                .main-content-faucet {
                    position: relative;
                    z-index: 10;
                    padding-top: 15vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .faucet-header {
                    margin-bottom: 2.5rem;
                }

                .faucet-title {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.1em;
                }

                .faucet-subtitle {
                    color: var(--text-dim);
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .faucet-card {
                    background: #0a0a0c;
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    padding: 2rem;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
                }

                .header-label {
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    line-height: 1.2;
                    margin: 0;
                }

                .header-sublabel {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--text-dim);
                    letter-spacing: 0.05em;
                    margin: 0;
                }

                .icon-box {
                    width: 44px;
                    height: 44px;
                    background: var(--primary-purple);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                    box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
                }

                .verified-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: rgba(16, 185, 129, 0.05);
                    color: #10b981;
                    padding: 0.5rem 0.8rem;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    flex-shrink: 0;
                    white-space: nowrap;
                }

                .stats-list {
                    margin-bottom: 2rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    padding: 1rem 1.25rem;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }

                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.8rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                }

                .stat-row:last-child { border-bottom: none; }

                .stat-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-value {
                    font-size: 12px;
                    font-weight: 700;
                    font-family: var(--font-mono);
                }

                .stat-value.highlight {
                    color: var(--primary-purple);
                }

                .request-btn {
                    width: 100%;
                    height: 56px;
                    background: var(--primary-purple);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 800;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: 0.3s;
                    letter-spacing: 0.05em;
                    box-shadow: var(--glow-purple);
                }

                .request-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                    box-shadow: 0 10px 20px rgba(168, 85, 247, 0.4);
                }

                .request-btn:disabled {
                    background: #222;
                    color: #555;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                
                .request-btn.loading {
                    background: rgba(168, 85, 247, 0.2);
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    color: white;
                    box-shadow: none;
                }

                .request-btn.success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                    box-shadow: none;
                }

                .error-box {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(239, 68, 68, 0.05);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    border-radius: 10px;
                    color: #ef4444;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }

                .success-footer {
                    margin-top: 1.25rem;
                    text-align: center;
                }

                .explorer-link {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--primary-purple);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    opacity: 0.7;
                    transition: 0.2s;
                }

                .explorer-link:hover {
                    opacity: 1;
                    text-decoration: underline;
                }

                .faucet-footer {
                    margin-top: 2rem;
                    font-size: 9px;
                    font-weight: 800;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                }

                .animate-in {
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .main-content-faucet { padding-top: 100px; padding-left: 1rem; padding-right: 1rem; }
                    .faucet-title { font-size: 2.5rem; }
                    .faucet-card { padding: 1.5rem; width: 100%; }
                    .stats-list { padding: 1rem; }
                    .stat-row { align-items: center; }
                    .stat-label { font-size: 9px; }
                    .stat-value { font-size: 11px; }
                    .verified-badge { padding: 0.3rem 0.6rem; font-size: 8px; }
                }
            `}</style>
        </div>
    );
}

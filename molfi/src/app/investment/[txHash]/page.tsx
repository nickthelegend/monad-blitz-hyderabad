
"use client";

import { use, useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatEther, parseEther, decodeEventLog } from 'viem';
import { Wallet, AlertCircle, RefreshCw, Activity, Bot } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MolfiAgentVaultABI from '@/abis/MolfiAgentVault.json';
import { shortenAddress, getExplorerUrl } from '@/lib/contract-helpers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AgentPerformanceChart from '@/components/AgentPerformanceChart';
import Script from 'next/script';

export default function InvestmentDetailsPage({ params }: { params: Promise<{ txHash: string }> }) {
    const { txHash } = use(params);
    const { address, isConnected } = useAccount();
    const [investment, setInvestment] = useState<any>(null);
    const [agentData, setAgentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentValue, setCurrentValue] = useState<string>('0');
    const [pnl, setPnl] = useState<string>('0');
    const [pnlPercentage, setPnlPercentage] = useState<string>('0');
    const [withdrawMode, setWithdrawMode] = useState<'profit' | 'all' | null>(null);
    const [fallbackAmount, setFallbackAmount] = useState<string>('0');
    const [fallbackShares, setFallbackShares] = useState<string>('0');

    // Wagmi hooks for withdrawal
    const { writeContractAsync, isPending: isWithdrawing } = useWriteContract();
    const publicClient = usePublicClient();
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<string>('');
    const [hasAutoScanned, setHasAutoScanned] = useState(false);
    const searchParams = useSearchParams();

    // Check for withdraw action in URL
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'withdraw') {
            setWithdrawMode('all');
        }
    }, [searchParams]);

    // Auto-recovery effect
    useEffect(() => {
        if (!loading && !investment && !isScanning && !scanError && !hasAutoScanned) {
            setHasAutoScanned(true);
            handleScan();
        }
    }, [loading, investment, isScanning, scanError, hasAutoScanned]);

    const handleScan = async () => {
        setIsScanning(true);
        setScanError(null);
        setScanStatus("Initializing blockchain scan...");

        try {
            if (!publicClient) throw new Error("Network connection failed. Please connect your wallet.");

            // 1. Get Tx Receipt
            setScanStatus(`Searching for transaction: ${shortenAddress(txHash)}...`);
            const cleanHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
            const receipt = await publicClient.getTransactionReceipt({ hash: cleanHash as `0x${string}` });

            if (!receipt) {
                // Determine if we should wait/retry? (Simple logic for now)
                throw new Error("Transaction not found on this chain. Check your network.");
            }

            // 2. Fetch All Agents to get Vault Addresses
            setScanStatus("Fetching agent protocols...");
            const agentsRes = await fetch('/api/agents');
            const agentsData = await agentsRes.json();
            const agents = agentsData.agents || [];

            // 3. Check for Vault interaction
            setScanStatus("Analyzing transaction logs...");
            let foundAgent = null;
            let mintedShares = '0';
            let amount = '0';

            for (const agent of agents) {
                if (agent.vaultAddress) {
                    // Look for ANY log from this vault address that could be a Deposit
                    const vaultLogs = receipt.logs.filter(l => l.address.toLowerCase() === agent.vaultAddress.toLowerCase());

                    for (const log of vaultLogs) {
                        try {
                            const event = decodeEventLog({
                                abi: MolfiAgentVaultABI,
                                data: log.data,
                                topics: log.topics,
                            });

                            if (event.eventName === 'Deposit') {
                                foundAgent = agent;
                                mintedShares = formatEther((event.args as any).shares);
                                amount = formatEther((event.args as any).assets);
                                break;
                            }
                        } catch (e) {
                            // This log might be a different event (e.g. Transfer), skip it
                            continue;
                        }
                    }
                    if (foundAgent) break;
                }
            }

            if (foundAgent) {
                setScanStatus(`Identified Investment in ${foundAgent.name}. Syncing...`);

                // 4. Register Investment
                const createRes = await fetch('/api/investments/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        txHash: txHash,
                        agentId: foundAgent.agentId,
                        userAddress: address || receipt.from,
                        amount: amount !== '0' ? amount : '100', // Fallback to 100 if amount extraction failed but log found
                        shares: mintedShares !== '0' ? mintedShares : (amount !== '0' ? amount : '100')
                    })
                });

                if (!createRes.ok) {
                    const errorData = await createRes.json();
                    throw new Error(errorData.error || "Database sync failed.");
                }

                setScanStatus("Restoration complete.");

                // Update local state instead of reloading
                await fetchInvestment(true);
                setIsScanning(false);
            } else {
                throw new Error("Transaction is valid but did not interact with any known Molfi Agent.");
            }

        } catch (err: any) {
            console.error("Scan failed:", err);
            setScanError(err.message || "Scan failed.");
            setScanStatus("");
            setIsScanning(false);
        }
    };

    const fetchInvestment = async (silently = false) => {
        if (!silently) setLoading(true);
        try {
            const res = await fetch(`/api/investments/${txHash}`);
            const data = await res.json();
            if (data.success) {
                setInvestment(data.investment);
                // Fetch agent details for "Agent Archi" (Architecture/Stats)
                if (data.investment.agents?.agentId) {
                    fetchAgentDetails(data.investment.agents.agentId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch investment:', error);
        } finally {
            if (!silently) setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        if (txHash) fetchInvestment();
    }, [txHash]);

    useEffect(() => {
        if (!investment || !publicClient) return;

        // Ensure vault address exists
        const vaultAddr = investment.agents?.vault_address;
        if (!vaultAddr) return;

        const dbAmountNum = parseFloat(investment.amount || '0');
        const dbSharesNum = parseFloat(investment.shares || '0');

        // If we already have real data, don't hydrate
        if (dbAmountNum > 0 && dbSharesNum > 0) return;

        const hydrateFromReceipt = async () => {
            try {
                // Ensure txHash has 0x prefix for wagmi/viem
                const cleanHash = investment.tx_hash.startsWith('0x') ? investment.tx_hash : `0x${investment.tx_hash}`;
                console.log(`[Hydration] Scanning logs for TX: ${cleanHash}`);

                const receipt = await publicClient.getTransactionReceipt({ hash: cleanHash as `0x${string}` });
                if (!receipt) return;

                // Scan logs for Deposit from correct vault
                const vaultLogs = receipt.logs.filter(
                    (l) => l.address.toLowerCase() === vaultAddr.toLowerCase()
                );

                for (const log of vaultLogs) {
                    try {
                        const event = decodeEventLog({
                            abi: MolfiAgentVaultABI,
                            data: log.data,
                            topics: log.topics,
                        });
                        if (event.eventName === 'Deposit') {
                            const assets = formatEther((event.args as any).assets);
                            const shares = formatEther((event.args as any).shares);
                            console.log(`[Hydration] Found Deposit: ${assets} assets`);
                            setFallbackAmount(assets);
                            setFallbackShares(shares);

                            // Proactively update DB if we found missing data
                            fetch('/api/investments/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    txHash: investment.tx_hash,
                                    agentId: investment.agents.agentId,
                                    userAddress: investment.user_address,
                                    amount: assets,
                                    shares: shares
                                })
                            }).catch(e => console.error("Sync backup failed", e));

                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (err) {
                console.error("Hydration failed:", err);
            }
        };

        hydrateFromReceipt();
    }, [investment, publicClient]);

    const fetchAgentDetails = async (agentId: string) => {
        try {
            const res = await fetch(`/api/agents/${agentId}`);
            const data = await res.json();
            if (data.success) {
                setAgentData(data.agent);
            }
        } catch (error) {
            console.error("Failed to fetch agent details:", error);
        }
    }

    // Read current share value (User's Position Value)
    const activeShares = (parseFloat(investment?.shares || '0') > 0
        ? investment.shares
        : fallbackShares).toString();

    const { data: shareValue, refetch: refetchShareValue } = useReadContract({
        address: investment?.agents?.vault_address as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: 'previewRedeem',
        args: [activeShares !== '0' ? parseEther(activeShares) : 0n],
        query: {
            enabled: !!investment?.agents?.vault_address && activeShares !== '0',
            refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
        }
    });

    const [pnlBreakdown, setPnlBreakdown] = useState({ realized: '0', unrealized: '0' });

    const { data: totalSupply } = useReadContract({
        address: investment?.agents?.vault_address as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: 'totalSupply',
        query: {
            enabled: !!investment?.agents?.vault_address,
            refetchInterval: 30000,
        }
    });

    // Set initial values from investment data (fallback if on-chain fails)
    useEffect(() => {
        if ((investment?.amount || parseFloat(fallbackAmount) > 0) && currentValue === '0') {
            const initialAmount = parseFloat(investment?.amount || '0') > 0
                ? parseFloat(investment.amount)
                : parseFloat(fallbackAmount);

            setCurrentValue(initialAmount.toFixed(2));
        }
    }, [investment, fallbackAmount, currentValue]);

    // Update PnL when share value is fetched or agent data updates
    useEffect(() => {
        if (investment || parseFloat(fallbackAmount) > 0) {
            const initialAmount = parseFloat(investment?.amount || '0') > 0
                ? parseFloat(investment.amount)
                : parseFloat(fallbackAmount);

            let currentValNum = initialAmount;

            if (shareValue) {
                currentValNum = parseFloat(formatEther(shareValue as bigint));
            } else {
                // Fallback: If we can't fetch share value, assume no change for now (0% PnL)
                // This prevents showing $0.00 and -100% PnL on errors
                currentValNum = initialAmount;
            }

            const onChainReturn = currentValNum - initialAmount;
            let calculatedPnl = onChainReturn;
            let uPnL = 0;
            let rPnL = 0;

            // Factor in agent performance if data is available
            if (agentData) {
                if (totalSupply && parseFloat(activeShares) > 0) {
                    // Precise calculation using on-chain supply
                    const totalSharesNum = parseFloat(formatEther(totalSupply as bigint));
                    const ownership = totalSharesNum > 0 ? parseFloat(activeShares) / totalSharesNum : 0;

                    uPnL = ownership * (agentData.unrealizedPnL || 0);
                    rPnL = ownership * (agentData.realizedPnL || 0);

                    if (shareValue) {
                        calculatedPnl = onChainReturn + uPnL;
                    } else {
                        calculatedPnl = rPnL + uPnL;
                        currentValNum = initialAmount + calculatedPnl;
                    }
                } else if (!shareValue) {
                    // Fallback: If on-chain data is totally inaccessible (no supply/no share value),
                    // Estimate based on Agent's overall ROI to show *something* other than 0.
                    // This assumes the user participated in the agent's full performance history (approximate).
                    const estimatedRoi = agentData.roi || 0;
                    if (estimatedRoi !== 0) {
                        calculatedPnl = initialAmount * (estimatedRoi / 100);
                        currentValNum = initialAmount + calculatedPnl;
                        // Split roughly for display
                        rPnL = calculatedPnl;
                    }
                }
            }

            setPnl(calculatedPnl.toFixed(4));
            setPnlPercentage(initialAmount > 0 ? ((calculatedPnl / initialAmount) * 100).toFixed(2) : "0.00");
            setCurrentValue(currentValNum.toFixed(2));

            setPnlBreakdown({
                realized: rPnL.toFixed(4),
                unrealized: uPnL.toFixed(4)
            });
        }
    }, [shareValue, investment, fallbackAmount, agentData, totalSupply, activeShares]);

    const handleWithdraw = async (mode: 'profit' | 'all') => {
        if (!investment?.agents?.vault_address) return;
        setWithdrawMode(mode);

        try {
            let tx;
            const sharesToUse = parseFloat(investment.shares || '0') > 0
                ? investment.shares
                : fallbackShares;

            if (mode === 'all') {
                // Redeem full shares
                tx = await writeContractAsync({
                    address: investment.agents.vault_address as `0x${string}`,
                    abi: MolfiAgentVaultABI,
                    functionName: 'redeem',
                    args: [
                        parseEther(sharesToUse.toString()),
                        address,
                        address
                    ],
                });
            } else {
                // Withdraw Profit Only
                // Profit = Current Value - Initial Investment
                const initialAmount = parseFloat(investment.amount || '0') > 0
                    ? parseFloat(investment.amount)
                    : parseFloat(fallbackAmount || '0');
                const currentVal = parseFloat(currentValue);
                const profit = currentVal - initialAmount;

                if (profit <= 0) {
                    alert("No profit to withdraw.");
                    setWithdrawMode(null);
                    return;
                }

                tx = await writeContractAsync({
                    address: investment.agents.vault_address as `0x${string}`,
                    abi: MolfiAgentVaultABI,
                    functionName: 'withdraw',
                    args: [
                        parseEther(profit.toFixed(18)), // precision handling
                        address,
                        address
                    ],
                });
            }
            setWithdrawHash(tx);
            console.log("Withdrawal TX:", tx);
        } catch (err) {
            console.error("Withdrawal failed:", err);
        } finally {
            setWithdrawMode(null);
        }
    };

    const [withdrawHash, setWithdrawHash] = useState<string | null>(null);
    const { isLoading: isConfirmingWithdraw, isSuccess: withdrawConfirmed } = useWaitForTransactionReceipt({
        hash: withdrawHash as `0x${string}` | undefined,
    });

    // Sync after withdrawal is confirmed
    useEffect(() => {
        if (withdrawConfirmed && investment) {
            const syncWithdrawal = async () => {
                try {
                    console.log("Syncing withdrawal to DB...");
                    await fetch('/api/investments/sync-withdrawal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userAddress: address,
                            agentId: investment.agents.agentId,
                            txHash: withdrawHash,
                            isFullWithdraw: withdrawMode === 'all' || currentValue === '0'
                        })
                    });

                    // Refresh data
                    fetchInvestment(true);
                    setWithdrawHash(null);
                } catch (err) {
                    console.error("Sync withdrawal failed:", err);
                }
            };
            syncWithdrawal();
        }
    }, [withdrawConfirmed, investment, address, withdrawHash]);

    if (loading) {
        return (
            <div className="container flex items-center justify-center min-h-[60vh] pt-32">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-primary" size={32} />
                    <p className="text-secondary">Loading investment details...</p>
                </div>
            </div>
        );
    }

    if (!investment) {
        return (
            <div className="container pt-32 text-center">
                <div className="glass-container inline-block p-8 max-w-lg w-full">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold mb-2">Investment Not Found</h1>
                    <p className="text-secondary mb-6">
                        Could not find investment details in our database.
                        <br />
                        <span className="text-sm opacity-70">If you just deposited, it might need to be synced.</span>
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="neon-button w-full flex items-center justify-center gap-2"
                        >
                            {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            {isScanning ? "SCANNING BLOCKCHAIN..." : "SCAN & RECOVER INVESTMENT"}
                        </button>

                        <Link href="/profile" className="neon-button white-secondary w-full">
                            Back to Profile
                        </Link>
                    </div>

                    {scanError && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                            {scanError}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="container flex items-center justify-center min-h-[60vh] pt-32">
                <div className="glass-container text-center max-w-md w-full p-8">
                    <Wallet size={48} className="mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
                    <p className="text-secondary mb-6">Connect your wallet to manage your investment.</p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    const isProfitable = parseFloat(pnl) >= 0;
    const canWithdrawProfit = parseFloat(pnl) > 0 && investment.status !== 'CLOSED';
    const canWithdrawAll = parseFloat(currentValue) > 0 && investment.status !== 'CLOSED';
    const initialCapital = (parseFloat(investment.amount || '0') > 0
        ? parseFloat(investment.amount)
        : parseFloat(fallbackAmount || '0')
    );

    return (
        <>
            <style jsx global>{`
                .glass-card {
                    background: rgba(10, 10, 10, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(196, 33, 50, 0.15);
                }
                .glow-red {
                    box-shadow: 0 0 15px rgba(196, 33, 50, 0.3);
                }
                .pulse-red {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .neon-button.white-secondary {
                    background: transparent;
                    border-color: rgba(255, 255, 255, 0.3);
                    color: rgba(255, 255, 255, 0.8);
                }
                .neon-button.white-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #ffffff;
                    color: #ffffff;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                }
            `}</style>

            <main className="max-w-[1536px] mx-auto px-4 py-8 mt-20 font-display text-white">
                <div className="glass-card rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center glow-red border border-primary/20 overflow-hidden">
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${investment.agents?.name || 'Unknown Agent'}`}
                                    alt={investment.agents?.name || 'Agent'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">
                                        {investment.agents?.name || 'Unknown Agent'}
                                    </h1>
                                    <span
                                        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${investment.status === 'CLOSED'
                                            ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${investment.status === 'CLOSED' ? 'bg-slate-400' : 'bg-emerald-500 pulse-red'}`} />
                                        {investment.status === 'CLOSED' ? 'Closed Circuit' : 'Active Circuit'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm max-w-md">
                                    Allocation secured on the agent vault. Track value and manage withdrawals below.
                                </p>
                                <p className="text-slate-500 text-xs mt-2 font-medium">
                                    CREATED {new Date(investment.created_at).toLocaleDateString()} • CONTRACT:{' '}
                                    <a
                                        href={getExplorerUrl(10143, investment.agents?.vault_address)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary transition-colors"
                                    >
                                        {shortenAddress(investment.agents?.vault_address || '')}
                                    </a>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Return</p>
                            <div className="flex flex-col items-end">
                                <span className={`text-4xl font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {isProfitable ? '+' : ''}{pnlPercentage}%
                                </span>
                                <span className={`text-slate-300 font-medium ${isProfitable ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {isProfitable ? '+' : ''}{pnl} USDT
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="glass-card p-5 rounded-xl border-l-4 border-l-primary/40">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Initial Capital</p>
                                <p className="text-2xl font-bold text-white">
                                    {initialCapital.toFixed(2)} <span className="text-xs text-slate-400">USDT</span>
                                </p>
                                <p className="text-emerald-500 text-xs mt-1 font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                    {(parseFloat(investment.shares || '0') > 0
                                        ? parseFloat(investment.shares)
                                        : parseFloat(fallbackShares || '0')
                                    ).toFixed(4)} shares
                                </p>
                            </div>
                            <div className="glass-card p-5 rounded-xl">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Current Value</p>
                                <p className="text-2xl font-bold text-white">
                                    {parseFloat(currentValue).toFixed(2)} <span className="text-xs text-slate-400">USDT</span>
                                </p>
                                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    <span className="material-symbols-outlined text-xs">
                                        {isProfitable ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                    {isProfitable ? '+' : ''}{pnlPercentage}%
                                </p>
                            </div>
                            <div className="glass-card p-5 rounded-xl">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Vault State</p>
                                <p className={`text-2xl font-bold flex items-center gap-2 ${investment.status === 'CLOSED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {investment.status === 'CLOSED' ? 'Closed' : 'Live'}
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                </p>
                                <a
                                    href={getExplorerUrl(10143, investment.agents?.vault_address)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 text-xs mt-1 truncate hover:text-primary cursor-pointer transition-colors block"
                                >
                                    {shortenAddress(investment.agents?.vault_address || '')}
                                </a>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Return Over Time</h3>
                                    <p className="text-slate-500 text-xs">Aggregated performance of the {investment.agents?.name || 'agent'} circuit</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase">24H</button>
                                    <button className="px-3 py-1 rounded bg-white/5 text-slate-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">7D</button>
                                    <button className="px-3 py-1 rounded bg-white/5 text-slate-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">1M</button>
                                </div>
                            </div>
                            <div className="h-64 w-full relative">
                                {agentData?.equityCurve ? (
                                    <AgentPerformanceChart
                                        data={agentData.equityCurve.map((point: any) => {
                                            const userValue = (point.value / 10000) * initialCapital;
                                            return {
                                                time: point.time,
                                                value: parseFloat(userValue.toFixed(2))
                                            };
                                        })}
                                        height={240}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-500">
                                        <div className="text-center">
                                            <Activity size={32} className="mx-auto mb-2 animate-pulse" />
                                            <p className="text-xs">Generating Performance Data...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                                    Live Agent Activity
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                {agentData?.activePositions && agentData.activePositions.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">
                                            <tr>
                                                <th className="px-6 py-4">Position</th>
                                                <th className="px-6 py-4 text-right">Size</th>
                                                <th className="px-6 py-4 text-right">Leverage</th>
                                                <th className="px-6 py-4 text-right">Entry Price</th>
                                                <th className="px-6 py-4 text-right">Unrealized PnL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-medium divide-y divide-white/5">
                                            {agentData.activePositions.map((pos: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pos.side === 'LONG'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-rose-500/10 text-rose-500'
                                                            }`}
                                                        >
                                                            {pos.side}
                                                        </span>
                                                        <span className="text-white">{pos.pair}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-300">
                                                        {parseFloat(pos.size).toLocaleString()} {pos.pair?.split('/')[0] || ''}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-300">{pos.leverage}x</td>
                                                    <td className="px-6 py-4 text-right text-slate-300 font-mono">
                                                        {Number(pos.entryPrice || 0).toLocaleString()}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl} USDT
                                                        <div className="text-[10px] opacity-70">
                                                            ({pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent}%)
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Bot size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-slate-400 text-sm">Agent is currently analyzing market for entry...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card rounded-xl p-6 border-t-4 border-t-primary">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">settings_suggest</span>
                                Position Management
                            </h3>
                            {investment.status === 'CLOSED' ? (
                                <div className="p-4 rounded bg-white/[0.03] border border-white/5 text-sm text-slate-400">
                                    This investment has been fully withdrawn.
                                    {investment.withdrawn_at && (
                                        <span className="block mt-2 text-xs text-slate-500">
                                            Closed on {new Date(investment.withdrawn_at).toLocaleDateString()}.
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleWithdraw('profit')}
                                        disabled={isWithdrawing || !canWithdrawProfit}
                                        className={`w-full py-3 px-4 rounded-lg border border-primary/20 bg-primary/5 text-primary text-sm font-bold uppercase tracking-wider hover:bg-primary/10 transition-all flex items-center justify-center gap-2 ${!canWithdrawProfit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isWithdrawing && withdrawMode === 'profit' ? 'Processing...' : 'Withdraw Profits Only'}
                                        <span className="material-symbols-outlined text-sm">lock</span>
                                    </button>
                                    <button
                                        onClick={() => handleWithdraw('all')}
                                        disabled={isWithdrawing || !canWithdrawAll}
                                        className={`w-full py-3 px-4 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-wider hover:bg-rose-700 transition-all glow-red ${!canWithdrawAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isWithdrawing && withdrawMode === 'all' ? 'Closing Position...' : 'Close Position (Withdraw All)'}
                                    </button>
                                    <div className="p-3 rounded bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                            {canWithdrawProfit
                                                ? '* Profit withdrawal uses on-chain share pricing.'
                                                : `* Profit withdrawal enabled only when position is in profit (>0.00%). Current ${isProfitable ? 'gain' : 'loss'}: ${Math.abs(parseFloat(pnl)).toFixed(2)} USDT.`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-300">neurology</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Neural Momentum</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">v2.4 Circuit Strategy</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                {agentData?.description || 'Utilizes high-frequency sentiment analysis and order-flow heuristics to capture micro-momentum in volatile assets. Optimized for low-latency execution.'}
                            </p>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Win Rate</span>
                                    <span className="text-sm font-bold text-white font-mono">{Number(agentData?.winRate ?? 0)}%</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Trades</span>
                                    <span className="text-sm font-bold text-white font-mono">{Number(agentData?.totalTrades ?? 0)}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Agent PnL</span>
                                    <span className={`text-sm font-bold font-mono ${Number(agentData?.totalPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {Number(agentData?.totalPnL ?? 0) >= 0 ? '+' : ''}{Number(agentData?.totalPnL ?? 0).toFixed(2)} USDT
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={`/clawdex/agent/${agentData?.agentId || investment.agents?.agentId}`}
                                className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                            >
                                View Full Agent Protocol
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>

                        <div className="relative rounded-xl p-6 overflow-hidden bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group cursor-pointer">
                            <div className="relative z-10">
                                <h4 className="text-white font-bold mb-1">Boost Your Yield</h4>
                                <p className="text-xs text-slate-300">Upgrade to Premium for lower execution fees and higher priority on agent trades.</p>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/5 group-hover:text-primary/10 transition-colors">diamond</span>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

// Helper component for Loader
function Loader2({ className, size }: { className?: string, size?: number }) {
    return <RefreshCw className={className} size={size} />;
}

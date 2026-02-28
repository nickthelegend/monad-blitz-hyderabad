"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { User, Bot, TrendingUp, Trophy, Zap, Plus, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/contract-helpers';
import { formatEther, parseEther } from 'viem';
import MolfiAgentVaultABI from '@/abis/MolfiAgentVault.json';
import Script from 'next/script';

type Agent = {
    id: string;
    agentId: string;
    name: string;
    type: string;
    status: string;
    tvl: string;
    aum: number;
    equity: number;
    performance30d: string;
    winRate: number;
    totalTrades: number;
    owner: string;
    recentDecisions?: any[];
    roi: number;
    agentType: string;
    vaultAddress?: string;
    apy?: number;
};

type InvestmentItem = {
    agentId: number;
    name: string;
    vaultAddress: `0x${string}`;
    deposited: number;
    currentValue: number;
    pnl: number;
    apy?: number;
    txHash: string;
    status: string;
};

type ActivityItem = {
    id: string;
    agent: string;
    action: string;
    result: string;
    profit: string;
    time: string;
    timestamp: number;
};

export default function ProfilePage() {
    const { isConnected, address } = useAccount();
    const publicClient = usePublicClient();
    const [investments, setInvestments] = useState<InvestmentItem[]>([]);
    const [closedInvestments, setClosedInvestments] = useState<InvestmentItem[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
    const [investmentsLoading, setInvestmentsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Real Data States
    const [myAgents, setMyAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(true);
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    const loadData = useCallback(async (shouldSync = true) => {
        if (!address || !publicClient) return;

        setInvestmentsLoading(true);
        setAgentsLoading(true);
        try {
            const res = await fetch('/api/agents');
            const data = await res.json();

            if (!data.success) {
                setInvestments([]);
                setClosedInvestments([]);
                setMyAgents([]);
                return;
            }

            const allAgents = data.agents || [];

            // Filter My Agents
            const userAgents = allAgents.filter((a: any) =>
                a.owner?.toLowerCase() === address.toLowerCase()
            );
            setMyAgents(userAgents);

            // Aggregate Activity from My Agents
            const allActivity: ActivityItem[] = [];
            userAgents.forEach((agent: any) => {
                if (agent.recentDecisions) {
                    agent.recentDecisions.forEach((d: any) => {
                        allActivity.push({
                            id: d.id || `${agent.id}-${d.timestamp}`,
                            agent: agent.name,
                            action: d.action === 'BUY' ? 'Position Opened' : 'Trade Executed',
                            result: d.action === 'BUY' ? 'Pending' : (d.profit >= 0 ? 'Win' : 'Loss'),
                            profit: d.profit ? (d.profit >= 0 ? `+$${d.profit}` : `-$${Math.abs(d.profit)}`) : '--',
                            time: new Date(d.timestamp).toLocaleDateString(),
                            timestamp: d.timestamp
                        });
                    });
                }
            });
            setActivities(allActivity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));

            // Process Investments from DB
            const investmentsRes = await fetch(`/api/investments/user/${address}`);
            const investmentsData = await investmentsRes.json();
            let initialInvestments = investmentsData.success ? investmentsData.investments : [];

            // Only consider ACTIVE investments for the UI
            const allInvestments = initialInvestments;

            let foundNew = false;

            // BACKGROUND SYNC LOGIC
            if (shouldSync && allAgents.length > 0) {
                setIsSyncing(true);
                const knownHashes = new Set(initialInvestments.map((inv: any) => inv.tx_hash.toLowerCase()));

                // Scan all agents for deposits from this user
                for (const agent of allAgents) {
                    if (!agent.vaultAddress) continue;

                    try {
                        const logs = await publicClient.getLogs({
                            address: agent.vaultAddress as `0x${string}`,
                            event: {
                                type: 'event',
                                name: 'Deposit',
                                inputs: [
                                    { type: 'address', indexed: true, name: 'sender' },
                                    { type: 'address', indexed: true, name: 'owner' },
                                    { type: 'uint256', indexed: false, name: 'assets' },
                                    { type: 'uint256', indexed: false, name: 'shares' }
                                ]
                            },
                            args: { owner: address },
                            fromBlock: 0n
                        });

                        for (const log of logs) {
                            const txHash = log.transactionHash.toLowerCase();
                            if (!knownHashes.has(txHash)) {
                                console.log(`[Sync] Found missing investment: ${txHash}`);
                                const assets = formatEther((log.args as any).assets || 0n);
                                const shares = formatEther((log.args as any).shares || 0n);

                                await fetch('/api/investments/create', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        txHash,
                                        agentId: agent.agentId,
                                        userAddress: address,
                                        amount: assets,
                                        shares: shares !== '0' ? shares : assets
                                    })
                                });
                                foundNew = true;
                            }
                        }
                    } catch (e) {
                        console.error(`Sync failed for agent ${agent.name}:`, e);
                    }
                }

                // NEW: Sync Withdrawals by checking current balance
                const activeForSync = allInvestments.filter((inv: any) => inv.status === 'ACTIVE');

                for (const inv of activeForSync) {
                    if (!inv.agents?.vault_address) continue;

                    try {
                        const balance = await publicClient.readContract({
                            address: inv.agents.vault_address as `0x${string}`,
                            abi: MolfiAgentVaultABI,
                            functionName: 'balanceOf',
                            args: [address]
                        }) as bigint;

                        if (balance === 0n) {
                            console.log(`[Sync] Found closed position for agent ${inv.agents.name}, marking CLOSED`);
                            await fetch('/api/investments/sync-withdrawal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userAddress: address,
                                    agentId: inv.agent_id,
                                    isFullWithdraw: true
                                })
                            });
                            foundNew = true;
                        }
                    } catch (e: any) {
                        if (e.name === 'ContractFunctionExecutionError' || e.message?.includes('returned no data')) {
                            console.warn(`[Sync] Contract not found or invalid for agent ${inv.agents.name} at ${inv.agents.vault_address}. Skipping.`);
                        } else {
                            console.error(`Withdraw sync failed for investment ${inv.tx_hash}:`, e);
                        }
                    }
                }

                if (foundNew) {
                    const refreshRes = await fetch(`/api/investments/user/${address}`);
                    const refreshData = await refreshRes.json();
                    initialInvestments = refreshData.success ? refreshData.investments : [];
                }
                setIsSyncing(false);
            }

            // Map to UI objects
            const finalInvestments = foundNew
                ? (await (await fetch(`/api/investments/user/${address}`)).json()).investments
                : allInvestments;

            const investmentItems: (InvestmentItem | null)[] = await Promise.all(
                finalInvestments.map(async (inv: any) => {
                    if (!inv.agents?.vault_address) return null;
                    const vaultAddress = inv.agents.vault_address as `0x${string}`;
                    const isClosed = inv.status === 'CLOSED';

                    try {
                        let currentAssets = 0n;
                        if (!isClosed) {
                            currentAssets = await publicClient.readContract({
                                address: vaultAddress,
                                abi: MolfiAgentVaultABI,
                                functionName: "convertToAssets",
                                args: [parseEther(inv.shares?.toString() || '0')],
                            }) as bigint;
                        }

                        const deposited = parseFloat(inv.amount);
                        const currentValue = isClosed ? 0 : parseFloat(formatEther(currentAssets));
                        const pnl = isClosed ? 0 : currentValue - deposited;

                        return {
                            agentId: Number(inv.agents.agent_id),
                            name: inv.agents.name,
                            vaultAddress,
                            deposited,
                            currentValue,
                            pnl,
                            apy: 0,
                            txHash: inv.tx_hash,
                            status: inv.status
                        };
                    } catch (err) {
                        return {
                            agentId: Number(inv.agents.agent_id),
                            name: inv.agents.name,
                            vaultAddress,
                            deposited: parseFloat(inv.amount),
                            currentValue: 0,
                            pnl: 0,
                            apy: 0,
                            txHash: inv.tx_hash,
                            status: inv.status
                        };
                    }
                })
            );

            const validItems = investmentItems.filter((i): i is InvestmentItem => i !== null);
            setInvestments(validItems.filter(i => i.status === 'ACTIVE'));
            setClosedInvestments(validItems.filter(i => i.status === 'CLOSED'));
        } catch (err) {
            console.error("Failed to fetch data", err);
            setInvestments([]);
        } finally {
            setInvestmentsLoading(false);
            setAgentsLoading(false);
            setIsSyncing(false);
        }
    }, [address, publicClient]);

    useEffect(() => {
        if (!isConnected || !address || !publicClient) {
            setInvestments([]);
            setClosedInvestments([]);
            setMyAgents([]);
            setActivities([]);
            setAgentsLoading(false);
            return;
        }

        loadData(true);
    }, [isConnected, address, publicClient, loadData]);

    if (!isConnected) {
        return (
            <div className="container mx-auto px-6 py-20 min-h-[80vh] flex flex-col items-center justify-center pt-[120px]">
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#c42132]/20 p-8 rounded-xl text-center max-w-md w-full shadow-[0_0_20px_rgba(196,33,50,0.15)]">
                    <User size={48} className="mx-auto mb-4 text-[#c42132]" />
                    <h1 className="text-2xl font-bold mb-2 text-white font-display">Connect Wallet</h1>
                    <p className="text-white/60 mb-6 font-display">Connect your wallet to view your profile.</p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    const totalTVL = myAgents.reduce((sum, agent) => sum + (agent.aum || 0), 0);
    const totalTVLDisplay = totalTVL >= 1000 ? `${(totalTVL / 1000).toFixed(1)}K` : totalTVL.toFixed(0);

    // Calculate PnL from agents info (just a placeholder using winrate for now to show something dynamic)
    const avgWinRate = myAgents.length > 0
        ? myAgents.reduce((sum, agent) => sum + agent.winRate, 0) / myAgents.length
        : 0;

    return (
        <>
            <style jsx global>{`
                .glass-card {
                    background: rgba(10, 10, 10, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(196, 33, 50, 0.15);
                }
                .glow-subtle {
                    box-shadow: 0 0 20px rgba(196, 33, 50, 0.05);
                }
            `}</style>

            <main className="max-w-[1536px] mx-auto px-4 py-10 space-y-8 font-display text-white mt-16">
                {/* User Info Section */}
                <section className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-8 border-b border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-transparent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                            <div className="relative size-32 rounded-full border-2 border-primary/20 p-1">
                                <img
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`}
                                />
                            </div>
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h2 className="text-4xl font-bold tracking-tight">Agent Commander</h2>
                                <span className="px-3 py-1 bg-primary/20 border border-primary/40 text-primary text-xs font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Reputation {avgWinRate > 0 ? Math.round(avgWinRate) : 98}/100
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-white/40">
                                <span className="text-sm font-mono tracking-wider">{shortenAddress(address || '')}</span>
                                <button className="hover:text-primary transition-colors" onClick={() => navigator.clipboard.writeText(address || '')}>
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Portfolio Summary Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Balance */}
                    <div className="glass-card p-6 rounded-xl glow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white/40 text-sm font-medium uppercase tracking-wider">Total TVL</span>
                            <span className="material-symbols-outlined text-white/20">account_balance_wallet</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-3xl font-bold tabular-nums">${totalTVLDisplay}</h3>
                            <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                {myAgents.length} Agents Active
                            </p>
                        </div>
                    </div>

                    {/* PnL */}
                    <div className="glass-card p-6 rounded-xl glow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white/40 text-sm font-medium uppercase tracking-wider">Avg Win Rate</span>
                            <span className="material-symbols-outlined text-white/20">show_chart</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-3xl font-bold text-emerald-400 tabular-nums">{avgWinRate.toFixed(1)}%</h3>
                            <p className="text-white/40 text-sm font-medium">All time performance</p>
                        </div>
                    </div>

                    {/* Asset Distribution Donut Placeholder */}
                    <div className="glass-card p-6 rounded-xl glow-subtle flex items-center gap-6">
                        <div className="relative size-24 flex-shrink-0">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                <circle className="stroke-white/5" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                                <circle className="stroke-primary" cx="18" cy="18" fill="none" r="16" strokeDasharray="65 100" strokeWidth="3"></circle>
                                <circle className="stroke-white/40" cx="18" cy="18" fill="none" r="16" strokeDasharray="25 100" strokeDashoffset="-65" strokeWidth="3"></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Assets</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">Distribution</h3>
                            <div className="space-y-1">
                                {myAgents.slice(0, 3).map((agent, i) => (
                                    <div key={agent.id} className="flex items-center gap-2 text-xs">
                                        <img
                                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`}
                                            alt=""
                                            className="size-4 rounded-full"
                                        />
                                        <span className="font-medium truncate max-w-[100px]">{agent.name}</span>
                                    </div>
                                ))}
                                {myAgents.length === 0 && <div className="text-xs text-white/20">No active agents</div>}
                            </div>
                        </div>
                    </div>
                </section>


                {/* Allocations Section */}
                <section className="glass-card rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold">Allocations</h3>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('closed')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'closed' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    Closed
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-white/40 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Invested</th>
                                    <th className="px-6 py-4">Current Value</th>
                                    <th className="px-6 py-4">PnL</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {investmentsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                            Loading allocations...
                                        </td>
                                    </tr>
                                ) : (activeTab === 'active' ? investments : closedInvestments).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                            No {activeTab} allocations found.
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'active' ? investments : closedInvestments).map((inv) => (
                                        <tr
                                            key={inv.txHash}
                                            // @ts-ignore
                                            onClick={() => window.location.href = `/investment/${inv.txHash}`}
                                            className="hover:bg-white/[0.05] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-primary/10 overflow-hidden border border-primary/20">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${inv.name}`}
                                                            alt={inv.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold block">{inv.name}</span>
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <Link href={`/clawdex/agent/${inv.agentId}`} className="text-xs text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                                                                View Agent <ExternalLink size={10} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono tracking-wider text-white/80">{inv.deposited.toFixed(4)} MON</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono tracking-wider font-bold text-white">{inv.currentValue.toFixed(4)} MON</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1 text-sm font-bold ${inv.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {inv.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                                                    <span>{inv.pnl > 0 ? '+' : ''}{inv.pnl.toFixed(4)} MON</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <a
                                                        href={`https://testnet.monadexplorer.com/tx/${inv.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                                                    >
                                                        Explorer <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Recent Activity Table */}
                <section className="glass-card rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Recent Activity</h3>
                        <button className="text-primary text-sm font-bold hover:underline" onClick={() => loadData(true)}>
                            {isSyncing ? "Syncing..." : "Refresh"}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-white/40 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Result</th>
                                    <th className="px-6 py-4">Profit</th>
                                    <th className="px-6 py-4 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                            No recent activity found.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-8 rounded ${activity.action === 'Position Opened' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'} flex items-center justify-center`}>
                                                        <span className="material-symbols-outlined text-[18px]">{activity.action === 'Position Opened' ? 'token' : 'swap_horiz'}</span>
                                                    </div>
                                                    <span className="text-sm font-medium">{activity.action}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold">{activity.agent}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.result === 'Win' ? 'bg-emerald-400/10 text-emerald-400' :
                                                    activity.result === 'Loss' ? 'bg-red-400/10 text-red-400' :
                                                        'bg-yellow-400/10 text-yellow-400'
                                                    }`}>
                                                    {activity.result}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-medium ${activity.profit.startsWith('+') ? 'text-emerald-400' :
                                                    activity.profit.startsWith('-') ? 'text-red-400' :
                                                        'text-white/40'
                                                    }`}>
                                                    {activity.profit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-white/40">{activity.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}

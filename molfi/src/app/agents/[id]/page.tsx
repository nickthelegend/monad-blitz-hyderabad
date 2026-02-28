
"use client";

import { use, useEffect, useState } from 'react';
import { TrendingUp, Shield, Zap, ExternalLink, Star, MessageSquare, Activity, X, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress, getExplorerUrl } from '@/lib/contract-helpers';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, erc20Abi } from 'viem';
import MolfiAgentVaultABI from '@/abis/MolfiAgentVault.json';
import { useRouter } from 'next/navigation';

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { address, isConnected } = useAccount();

    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [investAmount, setInvestAmount] = useState('');
    const [step, setStep] = useState<'IDLE' | 'APPROVING' | 'DEPOSITING' | 'SUCCESS'>('IDLE');

    // Fetch Agent Data
    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const res = await fetch('/api/agents');
                const data = await res.json();
                if (data.success) {
                    const found = data.agents.find((a: any) => String(a.agentId) === id || a.id === id);
                    if (found) setAgent(found);
                }
            } catch (error) {
                console.error('Failed to fetch agent:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [id]);

    // Contract Hooks
    const { writeContractAsync, isPending } = useWriteContract();

    const { data: assetAddress } = useReadContract({
        address: agent?.vaultAddress as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: 'asset',
        query: { enabled: !!agent?.vaultAddress }
    });

    const handleInvest = async () => {
        if (!agent?.vaultAddress || !assetAddress || !investAmount) return;

        try {
            setStep('APPROVING');
            const amountInfo = parseEther(investAmount);

            // 1. Approve
            const approveHash = await writeContractAsync({
                address: assetAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'approve',
                args: [agent.vaultAddress as `0x${string}`, amountInfo],
            });

            // Wait for approval (simplified for UI, ideally wait for tx)
            // In a real app we'd use useWaitForTransactionReceipt here for the approval hash

            setStep('DEPOSITING');

            // 2. Deposit
            const depositHash = await writeContractAsync({
                address: agent.vaultAddress as `0x${string}`,
                abi: MolfiAgentVaultABI,
                functionName: 'deposit',
                args: [amountInfo, address],
            });

            // Register off-chain
            await fetch('/api/investments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: depositHash,
                    agentId: agent.agentId,
                    userAddress: address,
                    amount: parseFloat(investAmount),
                    shares: parseFloat(investAmount), // Simplification: 1:1 for now if initial
                })
            });

            setStep('SUCCESS');
            setTimeout(() => {
                router.push(`/investment/${depositHash}`);
            }, 1000);

        } catch (error) {
            console.error('Investment failed:', error);
            setStep('IDLE');
        }
    };

    if (loading) {
        return (
            <div className="container min-h-screen pt-32 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="container min-h-screen pt-32 flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
                <Link href="/agents" className="neon-button">Back to Marketplace</Link>
            </div>
        );
    }

    const getTypeIcon = () => {
        switch (agent.agentType) {
            case 'fund-manager': return <TrendingUp size={24} />;
            case 'trader': return <Zap size={24} />;
            case 'analyst': return <Shield size={24} />;
            default: return <Zap size={24} />;
        }
    };

    const getRiskColor = () => {
        switch (agent.riskProfile) {
            case 'conservative': return '#10b981';
            case 'balanced': return '#c62132';
            case 'aggressive': return '#ef4444';
            default: return '#c62132';
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', paddingTop: '120px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Back Link */}
            <Link href="/agents" style={{ color: 'var(--primary-red)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem', display: 'inline-block' }}>
                ← Back to Marketplace
            </Link>

            {/* Header */}
            <div className="glass-container" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ color: 'var(--primary-red)' }}>
                                {getTypeIcon()}
                            </div>
                            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{agent.name}</h1>
                            <span
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--primary-red)',
                                    borderRadius: '20px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                }}
                            >
                                {agent.reputationScore || 95}/100
                            </span>
                        </div>

                        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                            {agent.description}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: getRiskColor() + '20',
                                    border: `1px solid ${getRiskColor()}`,
                                    borderRadius: '12px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: getRiskColor(),
                                    textTransform: 'capitalize',
                                }}
                            >
                                {agent.riskProfile}
                            </span>
                            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                Owner: <span className="text-mono">{shortenAddress(agent.owner || '')}</span>
                            </span>
                            <a
                                href={getExplorerUrl(10143, agent.owner)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--primary-red)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                                View on Explorer <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    <button
                        className="neon-button"
                        style={{ minWidth: '150px' }}
                        onClick={() => setIsInvestModalOpen(true)}
                    >
                        Invest in Agent
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-container" style={{ padding: '1.5rem' }}>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Value Locked</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-red)' }}>{agent.tvl || '$0'}</p>
                </div>
                <div className="glass-container" style={{ padding: '1.5rem' }}>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>30d Performance</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-red)' }}>{agent.performance30d || '0%'}</p>
                </div>
                <div className="glass-container" style={{ padding: '1.5rem' }}>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Win Rate</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-red)' }}>{agent.winRate || 0}%</p>
                </div>
                <div className="glass-container" style={{ padding: '1.5rem' }}>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Trades</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-red)' }}>{agent.totalTrades?.toLocaleString() || 0}</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Left Column */}
                <div>
                    {/* Performance Chart Placeholder */}
                    <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={20} style={{ color: 'var(--primary-red)' }} />
                            Performance
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>24h</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-red)' }}>{agent.performance24h || '0%'}</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>7d</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-red)' }}>{agent.performance7d || '0%'}</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>30d</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-red)' }}>{agent.performance30d || '0%'}</p>
                            </div>
                        </div>
                        <div style={{ height: '200px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p className="text-secondary">Performance Chart (Coming Soon)</p>
                        </div>
                    </div>

                    {/* Strategy Details */}
                    <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Strategy Details</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Trading Style</p>
                                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{agent.tradingStyle || 'Mixed'}</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Leverage</p>
                                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{agent.leverage || 1}x</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Target Assets</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {agent.targetAssets?.map((asset: string) => (
                                        <span
                                            key={asset}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'var(--primary-red)',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {asset}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="glass-container" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} style={{ color: 'var(--primary-red)' }} />
                            Community Feedback
                        </h2>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p className="text-secondary">No feedback yet. Be the first to review this agent!</p>
                            <button className="neon-button secondary" style={{ marginTop: '1rem' }}>
                                Leave Feedback
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Agent Info */}
                    <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Agent Information</h3>

                        {agent.vaultAddress && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Vault Contract</p>
                                <a href={getExplorerUrl(10143, agent.vaultAddress)} target="_blank" rel="noopener noreferrer" className="text-mono text-primary hover:underline text-xs break-all flex items-center gap-1">
                                    {shortenAddress(agent.vaultAddress)} <ExternalLink size={10} />
                                </a>
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Agent Wallet</p>
                            <p className="text-mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{agent.agentWallet || agent.owner}</p>
                        </div>

                        {agent.apiEndpoint && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>API Endpoint</p>
                                <a href={agent.apiEndpoint} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-red)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {agent.apiEndpoint} <ExternalLink size={12} />
                                </a>
                            </div>
                        )}

                        {agent.twitter && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Twitter</p>
                                <a href={`https://twitter.com/${agent.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-red)', fontSize: '0.875rem', textDecoration: 'none' }}>
                                    {agent.twitter}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-container" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="neon-button"
                                style={{ width: '100%' }}
                                onClick={() => setIsInvestModalOpen(true)}
                            >
                                Invest Now
                            </button>
                            <button className="neon-button secondary" style={{ width: '100%' }}>
                                <Star size={16} style={{ marginRight: '0.5rem' }} />
                                Add to Watchlist
                            </button>
                            <button className="neon-button secondary" style={{ width: '100%' }}>
                                <MessageSquare size={16} style={{ marginRight: '0.5rem' }} />
                                Leave Feedback
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investment Modal */}
            {isInvestModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-container" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsInvestModalOpen(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={24} className="text-primary" />
                            Invest Capital
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="text-secondary text-sm mb-2 block">Amount (ETH)</label>
                            <input
                                type="number"
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-lg font-mono outline-none focus:border-red-500"
                            />
                        </div>

                        {step !== 'IDLE' && (
                            <div className="bg-black/40 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {step === 'APPROVING' ? <Loader2 className="animate-spin text-yellow-500" size={16} /> : <Check className="text-green-500" size={16} />}
                                    <span className={step === 'APPROVING' ? 'text-white' : 'text-gray-500'}>Approving Token</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {step === 'DEPOSITING' ? <Loader2 className="animate-spin text-yellow-500" size={16} /> : (step === 'SUCCESS' ? <Check className="text-green-500" size={16} /> : <div className="w-4 h-4 border border-gray-600 rounded-full" />)}
                                    <span className={step === 'DEPOSITING' ? 'text-white' : 'text-gray-500'}>Depositing to Vault</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="neon-button w-full"
                            onClick={handleInvest}
                            disabled={step !== 'IDLE' || !investAmount || parseFloat(investAmount) <= 0}
                        >
                            {step === 'IDLE' ? 'Confirm Investment' :
                                step === 'SUCCESS' ? 'Success!' : 'Processing...'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

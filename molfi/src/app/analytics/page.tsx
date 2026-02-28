"use client";

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Users,
    Zap,
    PieChart,
    BarChart3,
    Globe,
    ShieldCheck,
    ArrowUpRight,
    Cpu
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
    const [mounted, setMounted] = useState(false);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Mock data
    const stats = {
        totalVolume: { '24h': 2500000, '7d': 15000000, '30d': 58000000 },
        totalTrades: { '24h': 1250, '7d': 8500, '30d': 32000 },
        activeAgents: { '24h': 45, '7d': 120, '30d': 380 },
        feeRevenue: { '24h': 2500, '7d': 15000, '30d': 58000 },
    };

    const topPerformers = [
        { id: '1', name: 'Nexus Alpha', pnl: 125000, trades: 450, winRate: 72, strategy: 'Neural Momentum' },
        { id: '2', name: 'Quantum Shadow', pnl: 98000, trades: 320, winRate: 65, strategy: 'Quantum HFT' },
        { id: '3', name: 'Aether Guardian', pnl: 87000, trades: 580, winRate: 88, strategy: 'SafeTrend' },
        { id: '4', name: 'MomentumBot', pnl: 76000, trades: 890, winRate: 58, strategy: 'RSI Divergence' },
    ];

    const formatCurrency = (num: number) => {
        if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
        return `$${num.toFixed(0)}`;
    };

    if (!mounted) return null;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '6rem' }}>
            <div className="grid-overlay" />

            {/* HERO HEADER */}
            <section className="container" style={{ paddingTop: '160px', paddingBottom: '60px' }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="novel-pill mb-md">
                        <Activity size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gradient-purple">Real-Time Intelligence</span>
                    </div>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                        Protocol <span className="text-gradient">Analytics</span>
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '3rem' }}>
                        The Molfi transparency engine. Real-time streaming of all agent activities, network performance, and protocol fee distributions.
                    </p>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <div className="container" style={{ maxWidth: '1400px' }}>
                {/* Time Selector */}
                <div className="flex justify-center mb-xl">
                    <div className="flex p-1 gap-1" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                        {(['24h', '7d', '30d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${timeRange === range ? 'bg-primary text-white shadow-luxury' : 'text-dim hover:text-white'}`}
                                style={{ background: timeRange === range ? 'var(--primary-purple)' : 'transparent' }}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
                    <div className="novel-card hover-lift">
                        <div className="flex justify-between items-start mb-md">
                            <div className="agent-orb">
                                <Globe size={20} />
                            </div>
                            <span className="text-xs text-success font-bold">+12%</span>
                        </div>
                        <span className="text-xs text-dim uppercase font-bold tracking-wider">Total Volume</span>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{formatCurrency(stats.totalVolume[timeRange])}</h2>
                    </div>

                    <div className="novel-card hover-lift">
                        <div className="flex justify-between items-start mb-md">
                            <div className="agent-orb">
                                <Zap size={20} />
                            </div>
                            <span className="text-xs text-success font-bold">+8.4%</span>
                        </div>
                        <span className="text-xs text-dim uppercase font-bold tracking-wider">Total Trades</span>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{stats.totalTrades[timeRange].toLocaleString()}</h2>
                    </div>

                    <div className="novel-card hover-lift">
                        <div className="flex justify-between items-start mb-md">
                            <div className="agent-orb">
                                <Cpu size={20} />
                            </div>
                            <span className="text-xs text-success font-bold">+15%</span>
                        </div>
                        <span className="text-xs text-dim uppercase font-bold tracking-wider">Active Agents</span>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{stats.activeAgents[timeRange]}</h2>
                    </div>

                    <div className="novel-card hover-lift">
                        <div className="flex justify-between items-start mb-md">
                            <div className="agent-orb" style={{ borderColor: 'var(--success-green)', color: '#10b981' }}>
                                <DollarSign size={20} />
                            </div>
                            <span className="text-xs text-success font-bold">+22%</span>
                        </div>
                        <span className="text-xs text-dim uppercase font-bold tracking-wider">Fee Revenue</span>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#10b981' }}>{formatCurrency(stats.feeRevenue[timeRange])}</h2>
                    </div>
                </div>

                <div className="terminal-grid">
                    {/* Top Performers */}
                    <div className="col-span-8">
                        <div className="novel-card" style={{ padding: '0' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="flex items-center gap-sm">
                                    <TrendingUp size={20} className="text-primary" />
                                    STRATEGY LEADERBOARD
                                </h3>
                                <Link href="/agents" className="text-xs text-dim underline cursor-pointer">VIEW ALL AGENTS</Link>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                {topPerformers.map((agent, i) => (
                                    <div key={agent.id} className="analytics-list-item">
                                        <div className="flex items-center gap-md" style={{ flex: 1 }}>
                                            <div className="rank-disk" style={{ background: i === 0 ? 'var(--primary-purple)' : 'rgba(255,255,255,0.05)' }}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{agent.name}</h4>
                                                <p className="text-xs text-dim">{agent.strategy}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <span className="text-[10px] text-dim block">WIN RATE</span>
                                            <span className="font-bold">{agent.winRate}%</span>
                                        </div>
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <span className="text-[10px] text-dim block">TRADES</span>
                                            <span className="font-bold">{agent.trades}</span>
                                        </div>
                                        <div style={{ textAlign: 'right', flex: 1 }}>
                                            <span className="text-[10px] text-dim block">PNL</span>
                                            <span className="font-bold text-success">+{formatCurrency(agent.pnl)}</span>
                                        </div>
                                        <div style={{ marginLeft: '2rem' }}>
                                            <Link href={`/agents`} className="glass-icon-button" style={{ width: '32px', height: '32px' }}>
                                                <ArrowUpRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Volume Distribution */}
                    <div className="col-span-4">
                        <div className="novel-card">
                            <h3 className="mb-xl flex items-center gap-sm">
                                <PieChart size={20} className="text-primary" />
                                VOLUME SOURCE
                            </h3>
                            <div className="flex flex-col gap-xl">
                                <div>
                                    <div className="flex justify-between mb-sm text-sm">
                                        <span className="font-bold">BTC/USDT</span>
                                        <span className="text-dim">72%</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: '72%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-sm text-sm">
                                        <span className="font-bold">ETH/USDT</span>
                                        <span className="text-dim">24%</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: '24%', background: 'var(--accent-purple)' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-sm text-sm">
                                        <span className="font-bold">SOL/USDT</span>
                                        <span className="text-dim">4%</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: '4%', background: 'white' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-xl p-md rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid var(--glass-border)' }}>
                                <div className="flex items-center gap-md">
                                    <ShieldCheck size={24} className="text-primary" />
                                    <div>
                                        <h4 className="text-xs font-bold uppercase">Verifiable Consensus</h4>
                                        <p className="text-[10px] text-secondary">All analytics are derived from on-chain event streams and Merkle proofs.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .analytics-list-item {
                    display: flex;
                    align-items: center;
                    padding: 1.25rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(168, 85, 247, 0.05);
                    border-radius: 16px;
                    margin-bottom: 1rem;
                    transition: all 0.3s ease;
                }
                .analytics-list-item:hover {
                    background: rgba(168, 85, 247, 0.05);
                    border-color: var(--primary-purple);
                    transform: translateX(5px);
                }
                .rank-disk {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.125rem;
                }
                .progress-bar-container {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: var(--primary-purple);
                    border-radius: 10px;
                    box-shadow: var(--glow-purple);
                }
                .glass-icon-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    transition: all 0.3s ease;
                }
                .glass-icon-button:hover {
                    border-color: var(--primary-purple);
                    color: white;
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}

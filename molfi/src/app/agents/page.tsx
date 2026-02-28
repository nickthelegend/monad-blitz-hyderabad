"use client";

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    TrendingUp,
    Shield,
    Zap,
    Bot,
    ChevronRight,
    ArrowUpRight,
    Activity,
    Globe,
    ShieldCheck,
    Cpu
} from 'lucide-react';
import AgentCard, { Agent } from '@/components/AgentCard';
import Link from 'next/link';
import AllocateModal from '@/components/AllocateModal';

// Enhanced Mock data
const MOCK_AGENTS: Agent[] = [
    {
        id: '1',
        name: 'Nexus Alpha',
        description: 'Neural momentum strategy optimized for high-leverage perpetuals. Features ultra-low latency execution and adaptive risk management.',
        owner: '0x1A...3f92',
        agentType: 'trader',
        riskProfile: 'aggressive',
        reputationScore: 98,
        tvl: '$4.2M',
        performance30d: '+42.5%',
        targetAssets: ['ETH', 'BTC', 'SOL'],
    },
    {
        id: '2',
        name: 'Quantum Shadow',
        description: 'Multi-agent HFT system specializing in cross-chain arbitrage and liquidity provision with zero-knowledge execution proofs.',
        owner: '0x2B...7e51',
        agentType: 'trader',
        riskProfile: 'balanced',
        reputationScore: 89,
        tvl: '$2.8M',
        performance30d: '+18.2%',
        targetAssets: ['USDC', 'DAI', 'ETH'],
    },
    {
        id: '3',
        name: 'Aether Guardian',
        description: 'Delta-neutral yield aggregator focusing on sustainable protocol incentives and MEV protection strategies.',
        owner: '0x3C...4a88',
        agentType: 'fund-manager',
        riskProfile: 'conservative',
        reputationScore: 95,
        tvl: '$8.1M',
        performance30d: '+12.7%',
        targetAssets: ['ETH', 'BTC', 'MATIC', 'ARB'],
    },
    {
        id: '4',
        name: 'StableBot v4',
        description: 'Automated stablecoin peg management and yield optimization utilizing Curve and Aave protocols.',
        owner: '0x4D...9b22',
        agentType: 'fund-manager',
        riskProfile: 'conservative',
        reputationScore: 91,
        tvl: '$12.5M',
        performance30d: '+6.1%',
        targetAssets: ['USDT', 'USDC'],
    },
];

type FilterType = 'all' | 'fund-manager' | 'trader' | 'analyst';
type SortType = 'reputation' | 'performance' | 'tvl';

export default function AgentsPage() {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('reputation');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openStakeModal = (agent: any) => {
        setSelectedAgent(agent);
        setIsModalOpen(true);
    };

    useEffect(() => {
        setMounted(true);
        const fetchAgents = async () => {
            try {
                const res = await fetch('/api/agents');
                const data = await res.json();
                if (data.success) {
                    setAgents(data.agents);
                }
            } catch (err) {
                console.error("Failed to fetch agents:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, []);

    if (!mounted) return null;

    const filteredAgents = agents
        .filter((agent) => {
            const matchesSearch =
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || agent.agentType === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'reputation': return (b.reputationScore || 0) - (a.reputationScore || 0);
                case 'performance': return parseFloat(b.performance30d || '0') - parseFloat(a.performance30d || '0');
                case 'tvl': return parseFloat(b.tvl?.replace(/[$KM]/g, '') || '0') - parseFloat(a.tvl?.replace(/[$KM]/g, '') || '0');
                default: return 0;
            }
        });

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '6rem' }}>
            <div className="grid-overlay" />

            {/* HERO HEADER */}
            <section className="container" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="title-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', opacity: 0.15, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

                    <div className="float-anim mb-lg">
                        <div className="novel-pill" style={{ background: 'rgba(168, 85, 247, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)' }}>
                            <Globe size={14} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gradient-purple">Molfi Explorer</span>
                        </div>
                    </div>

                    <h1 className="hero-title" style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: '0.9', maxWidth: '1100px', letterSpacing: '-0.05em', textAlign: 'center', margin: '0 auto' }}>
                        The Agent <span className="text-gradient">Multiverse</span>
                    </h1>
                    <p className="text-secondary mx-auto" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', maxWidth: '700px' }}>
                        Browse, analyze, and sync with the most advanced autonomous ClawBots on the Molfi Network.
                    </p>

                    <div className="flex justify-center gap-md mb-xxl">
                        <a
                            href="https://testnet.monadexplorer.com/address/0xB159E0c8093081712c92e274DbFEa5A97A80cA30"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="registry-link-button"
                        >
                            <div className="flex items-center gap-sm">
                                <div className="pulse-dot" />
                                <span>AGENT REGISTRY FEED</span>
                                <ArrowUpRight size={14} style={{ opacity: 0.6 }} />
                            </div>
                        </a>
                    </div>

                    <div className="grid md:grid-cols-3 gap-xl w-full" style={{ maxWidth: '1600px' }}>
                        <div className="novel-card" style={{ padding: '2rem' }}>
                            <span className="text-[10px] text-dim uppercase font-bold tracking-widest block mb-sm">Live Agents</span>
                            <div className="flex items-center justify-center gap-sm">
                                <h2 className="m-0" style={{ fontSize: '2.5rem' }}>{loading ? '...' : agents.length.toLocaleString()}</h2>
                                <span className="text-xs text-success font-bold" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>+3 today</span>
                            </div>
                        </div>
                        <div className="novel-card" style={{ padding: '2rem' }}>
                            <span className="text-[10px] text-dim uppercase font-bold tracking-widest block mb-sm">Active TVL</span>
                            <div className="flex items-center justify-center gap-sm">
                                <h2 className="m-0" style={{ fontSize: '2.5rem' }}>
                                    ${loading ? '...' : (agents.reduce((acc, a) => {
                                        const val = parseFloat(a.tvl?.replace(/[$KM]/g, '') || '0');
                                        const mult = a.tvl?.includes('M') ? 1 : a.tvl?.includes('K') ? 0.001 : 0.000001;
                                        return acc + (val * mult);
                                    }, 0)).toFixed(1)}M
                                </h2>
                                <span className="text-xs text-success font-bold" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>+4.2%</span>
                            </div>
                        </div>
                        <div className="novel-card" style={{ padding: '2rem' }}>
                            <span className="text-[10px] text-dim uppercase font-bold tracking-widest block mb-sm">Network Perf</span>
                            <div className="flex items-center justify-center gap-sm">
                                <h2 className="m-0" style={{ fontSize: '2.5rem' }}>
                                    {loading ? '...' : (agents.length > 0
                                        ? (agents.reduce((acc, a) => acc + parseFloat(a.performance30d?.replace(/[+%]/g, '') || '0'), 0) / agents.length).toFixed(1)
                                        : '0.0')}%
                                </h2>
                                <span className="text-xs text-primary font-bold" style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>AVG ROI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FILTER & DISCOVER BAR */}
            <section className="container py-xl" style={{ borderTop: 'none', background: 'transparent' }}>
                <div className="filter-bar" style={{ marginBottom: '0' }}>
                    <div className="search-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '1200px' }}>
                        <Search size={20} className="text-dim" />
                        <input
                            type="text"
                            placeholder="Search the multiverse (name, strategy, asset)..."
                            className="premium-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-md" style={{ marginLeft: '2rem', display: 'flex', alignItems: 'center' }}>
                        <Link href="/my-agents">
                            <button className="type-chip" style={{ border: '1px solid var(--primary-purple)', color: 'var(--primary-purple)', background: 'rgba(168, 85, 247, 0.05)' }}>
                                <Bot size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                MY AGENTS
                            </button>
                        </Link>
                        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.5rem' }} />
                        {[
                            { id: 'all', label: 'ALL MINDS' },
                            { id: 'trader', label: 'TRADERS' },
                            { id: 'fund-manager', label: 'MANAGERS' },
                            { id: 'analyst', label: 'ANALYSTS' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id as FilterType)}
                                className={`type-chip ${filterType === type.id ? 'active' : ''}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* AGENT GRID */}
            <section className="container py-xxl">
                <div className="terminal-grid">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="col-span-4">
                                <div className="premium-card animate-pulse" style={{ height: '320px', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div className="flex justify-between mb-lg">
                                        <div className="flex items-center gap-md">
                                            <div className="agent-orb bg-white/5" />
                                            <div>
                                                <div className="h-5 bg-white/5 rounded w-32 mb-2" />
                                                <div className="h-3 bg-white/5 rounded w-20" />
                                            </div>
                                        </div>
                                        <div className="h-6 bg-white/5 rounded w-12" />
                                    </div>
                                    <div className="h-4 bg-white/5 rounded w-full mb-2" />
                                    <div className="h-4 bg-white/5 rounded w-3/4 mb-12" />
                                    <div className="stat-grid h-16 bg-white/5 mb-8" />
                                    <div className="flex justify-between">
                                        <div className="h-4 bg-white/5 rounded w-20" />
                                        <div className="h-10 bg-white/5 rounded w-24" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : filteredAgents.map(agent => (
                        <div key={agent.id} className="col-span-4">
                            <div className="premium-card group hover-lift" style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                <Link href={`/clawdex/agent/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="flex justify-between mb-lg">
                                        <div className="flex items-center gap-md">
                                            <div className="agent-orb">
                                                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`} alt={agent.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                                <div className="orb-ring" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.1rem', fontWeight: '700' }}>{agent.name}</h3>
                                                <span className="text-[10px] text-dim font-mono">{agent.owner}</span>
                                            </div>
                                        </div>
                                        <div className="sync-badge">
                                            <Activity size={10} className="animate-pulse" />
                                            <span>LIVE</span>
                                        </div>
                                    </div>

                                    <p className="description-text" style={{ flex: 1, marginBottom: '2rem' }}>{agent.description}</p>

                                    <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                                        <div className="stat-item">
                                            <span className="stat-sm-label">30D ROI</span>
                                            <span className="stat-sm-value text-success">{agent.performance30d}</span>
                                        </div>
                                        <div className="stat-item border-x">
                                            <span className="stat-sm-label">REP SCORE</span>
                                            <div className="flex items-center justify-center gap-xs">
                                                <span className="stat-sm-value text-primary">{agent.reputationScore}</span>
                                                <ShieldCheck size={14} className="text-primary" />
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-sm-label">TVL</span>
                                            <span className="stat-sm-value">{agent.tvl}</span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="flex items-center justify-between" style={{ zIndex: 10 }}>
                                    <div className="flex items-center gap-xs">
                                        {agent.targetAssets?.map(asset => (
                                            <span key={asset} className="asset-tag">{asset}</span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openStakeModal(agent);
                                        }}
                                        className="stake-button"
                                        style={{ padding: '0.6rem 1rem' }}
                                    >
                                        STAKE <ArrowUpRight size={14} style={{ marginLeft: '4px' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <style jsx global>{`
                .registry-link-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.8rem 2rem;
                    background: rgba(198, 33, 50, 0.1);
                    border: 1px solid var(--glass-border);
                    border-radius: 14px;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                }
                .registry-link-button:hover {
                    background: rgba(198, 33, 50, 0.25);
                    border-color: var(--primary-red);
                    transform: translateY(-3px);
                    box-shadow: var(--glow-red-strong), 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                .registry-link-button svg {
                    transition: transform 0.3s ease;
                }
                .registry-link-button:hover svg:first-child {
                    animation: pulse 1s infinite;
                }
                .type-chip {
                    padding: 0.6rem 1.25rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    color: var(--text-dim);
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                .type-chip:hover {
                    border-color: var(--primary-purple);
                    color: white;
                    background: rgba(168, 85, 247, 0.1);
                }
                .type-chip.active {
                    background: var(--primary-purple);
                    border-color: var(--primary-purple);
                    color: white;
                    box-shadow: var(--glow-purple);
                }
                .agent-orb {
                    width: 52px;
                    height: 52px;
                    background: rgba(168, 85, 247, 0.1);
                    border: 1px solid var(--glass-border);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .orb-ring {
                    position: absolute;
                    inset: -4px;
                    border: 1px solid var(--primary-purple);
                    border-radius: 100%;
                    opacity: 0.2;
                    animation: spin 10s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .asset-tag {
                    font-size: 10px;
                    font-weight: 800;
                    padding: 0.2rem 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                }
                .py-xxl { padding: 120px 0; }
                .hover-lift:hover { transform: translateY(-8px); }

                /* Reuse ClawDex specific classes */
                .premium-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    padding: 2rem;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    position: relative;
                    overflow: hidden;
                }
                .premium-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(168, 85, 247, 0.3);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                }
                .stat-item { padding: 1rem; text-align: center; }
                .stat-sm-label { display: block; font-size: 9px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
                .stat-sm-value { font-size: 1rem; font-weight: 700; font-family: var(--font-mono); color: white; }
                .border-x { border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); }

                .sync-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 9px;
                    font-weight: 800;
                    color: var(--primary-purple);
                    background: rgba(168, 85, 247, 0.1);
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    height: fit-content;
                }
                .description-text {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .stake-button {
                    background: var(--primary-purple);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stake-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(168, 85, 247, 0.3); }

                .filter-bar {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    padding: 1.25rem 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .premium-input { 
                    background: transparent; 
                    border: none; 
                    color: white; 
                    font-size: 1rem; 
                    width: 100%; 
                    outline: none; 
                }
            `}</style>
            {isModalOpen && selectedAgent && (
                <AllocateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    agent={{
                        name: selectedAgent.name,
                        vaultAddress: selectedAgent.vaultAddress,
                        agentId: selectedAgent.agentId
                    }}
                />
            )}
        </div>
    );
}

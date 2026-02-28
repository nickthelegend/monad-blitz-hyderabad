"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
    Activity,
    Zap,
    Bot,
    TrendingUp,
    TrendingDown,
    ShieldCheck,
    Globe,
    BarChart3,
    Lock,
    ArrowUpRight,
    Search,
    Filter
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLivePrices } from '@/lib/useLivePrices';
import { AIAgent, Position, TradingDecision } from '@/lib/agents';
import AllocateModal from '@/components/AllocateModal';
import { CryptoIcon } from '@ledgerhq/crypto-icons';

// --- Sub-components ---

const MarketTicker = () => {
    const prices = useLivePrices();
    const tickerItems = Array.from(prices.values());

    return (
        <div className="ticker-container" style={{ borderBottom: '1px solid rgba(198, 33, 50, 0.2)', background: 'rgba(5, 5, 5, 0.8)' }}>
            <div className="ticker-content">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                    <span key={i} className="ticker-item">
                        <CryptoIcon ledgerId={LEDGER_IDS[item.symbol] || 'bitcoin'} ticker={item.symbol.split('/')[0]} size="16px" />
                        <span className="ticker-symbol" style={{ marginLeft: '4px' }}>{item.symbol}</span>
                        <span className="ticker-price">${item.price.toLocaleString()}</span>
                        <span className={`ticker-change ${item.change24h >= 0 ? 'up' : 'down'}`}>
                            {item.change24h >= 0 ? '▲' : '▼'} {Math.abs(item.change24h).toFixed(2)}%
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
};

const AgentCard = ({ agent, onStake }: { agent: any; onStake: (agent: any) => void }) => {
    const formatAum = (aum: number) => {
        if (!aum || aum === 0) return '$0';
        if (aum >= 1000000) return `$${(aum / 1000000).toFixed(1)}M`;
        if (aum >= 1000) return `$${(aum / 1000).toFixed(1)}K`;
        return `$${aum.toFixed(0)}`;
    };

    return (
        <div className="premium-card group">
            <div className="card-top">
                <div className="flex items-center gap-lg">
                    <div className="agent-orb">
                        <img src={agent.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`} alt={agent.name} />
                        <div className="orb-ring" />
                    </div>
                    <div>
                        <h3 className="agent-title">{agent.name}</h3>
                        <div className="flex gap-sm items-center">
                            <span className="strategy-tag">{agent.strategy || agent.personality || 'Neural Core'}</span>
                            {agent.openPositions > 0 && (
                                <div className="sync-badge">
                                    <Activity size={10} className="animate-pulse" />
                                    <span>{agent.openPositions} OPEN</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="apy-display">
                    <span className="apy-label">ROI</span>
                    <span className="apy-value" style={{ color: (agent.roi || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {(agent.roi || 0) >= 0 ? '+' : ''}{(agent.roi || 0).toFixed(1)}%
                    </span>
                </div>
            </div>

            <p className="description-text">
                {agent.description || `Autonomous neural entity specialized in ${agent.personality || 'Balanced'} market strategies. Optimizing for long-term alpha on Monad.`}
            </p>

            {/* Real PnL indicator */}
            {agent.totalPnL != null && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', marginBottom: '0.75rem', borderRadius: 6,
                    background: agent.totalPnL >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${agent.totalPnL >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                }}>
                    <span style={{ color: '#888' }}>Total PnL</span>
                    <span style={{ color: agent.totalPnL >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {agent.totalPnL >= 0 ? '+' : ''}${agent.totalPnL.toFixed(4)}
                    </span>
                </div>
            )}

            <div className="stat-grid">
                <div className="stat-item">
                    <span className="stat-sm-label">VOLUME</span>
                    <span className="stat-sm-value">{formatAum(agent.aum)}</span>
                </div>
                <div className="stat-item border-x">
                    <span className="stat-sm-label">WIN RATE</span>
                    <span className="stat-sm-value">{agent.winRate || 0}%</span>
                </div>
                <div className="stat-item">
                    <span className="stat-sm-label">TRADES</span>
                    <span className="stat-sm-value">{agent.totalTrades || 0}</span>
                </div>
            </div>

            <div className="card-footer">
                <Link href={`/clawdex/agent/${agent.agentId || agent.id}`} className="details-link">
                    ClawBot Profile <ArrowUpRight size={14} />
                </Link>
                <button className="stake-button" onClick={() => onStake(agent)}>
                    ALLOCATE
                </button>
            </div>
        </div>
    );
};

const PAIR_ICONS: Record<string, string> = {
    'BTC/USDT': '₿', 'ETH/USDT': 'Ξ', 'SOL/USDT': '◎',
    'LINK/USDT': '⬡', 'DOGE/USDT': 'Ð', 'AVAX/USDT': '▲',
    'MATIC/USDT': '⬠', 'DOT/USDT': '●', 'NEAR/USDT': 'Ⓝ',
};

const PAIR_COLORS: Record<string, string> = {
    'BTC/USDT': '#f7931a', 'ETH/USDT': '#627eea', 'SOL/USDT': '#00ffa3',
    'LINK/USDT': '#2a5ada', 'DOGE/USDT': '#c3a634', 'AVAX/USDT': '#e84142',
    'MATIC/USDT': '#8247e5', 'DOT/USDT': '#e6007a', 'NEAR/USDT': '#00c1de',
};

const LEDGER_IDS: Record<string, string> = {
    'BTC/USDT': 'bitcoin',
    'ETH/USDT': 'ethereum',
    'SOL/USDT': 'solana',
    'LINK/USDT': 'ethereum/erc20/chainlink',
    'DOGE/USDT': 'dogecoin',
    'AVAX/USDT': 'avalanche_c_chain',
    'MATIC/USDT': 'polygon',
    'DOT/USDT': 'polkadot',
    'NEAR/USDT': 'near',
};

const TradingPairsPanel = () => {
    const prices = useLivePrices();

    const allPairs = [
        'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
        'LINK/USDT', 'DOGE/USDT', 'AVAX/USDT',
        'MATIC/USDT', 'DOT/USDT', 'NEAR/USDT',
    ];

    return (
        <div className="neural-stream-container">
            <div className="stream-header">
                <div className="flex items-center gap-sm">
                    <div className="neural-icon">
                        <BarChart3 size={16} />
                    </div>
                    <span className="header-text">Available Trading Pairs</span>
                </div>
                <div className="live-status">
                    <div className="pulse-dot" />
                    <span>LIVE</span>
                </div>
            </div>

            <div className="pairs-grid">
                {allPairs.map((pair) => {
                    const data = prices.get(pair);
                    const icon = PAIR_ICONS[pair] || '◆';
                    const color = PAIR_COLORS[pair] || '#c62132';
                    const price = data?.price ?? 0;
                    const change = data?.change24h ?? 0;
                    const volume = data?.volume24h ?? 0;
                    const isUp = change >= 0;
                    const base = pair.split('/')[0];

                    return (
                        <div key={pair} className="pair-row">
                            <div className="pair-left">
                                <div className="pair-icon-wrap" style={{ background: `${color}15`, borderColor: `${color}40`, overflow: 'hidden' }}>
                                    <CryptoIcon ledgerId={LEDGER_IDS[pair] || 'bitcoin'} ticker={base} size="20px" />
                                </div>
                                <div>
                                    <div className="pair-name">{base}<span className="pair-quote">/USDT</span></div>
                                    <div className="pair-label">{base}</div>
                                </div>
                            </div>

                            <div className="pair-center">
                                <div className="pair-price">
                                    {price > 0 ? `$${price < 1 ? price.toFixed(4) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                </div>
                                <div className={`pair-change ${isUp ? 'up' : 'down'}`}>
                                    {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                                </div>
                            </div>

                            <div className="pair-right">
                                <div className="pair-vol-bar">
                                    <div className="pair-vol-fill" style={{ width: `${Math.min(100, Math.max(10, (volume / 50000) * 100))}%`, background: color }} />
                                </div>
                                <span className="pair-vol-text">
                                    {volume > 1e6 ? `${(volume / 1e6).toFixed(1)}M` : volume > 1e3 ? `${(volume / 1e3).toFixed(0)}K` : '—'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Page ---

export default function ClawDexPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="grid-overlay" />
            <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <p className="text-secondary">Loading Molfi Agents...</p>
            </div>
        </div>
    );

    return <ClawDexPageContent />;
}

function ClawDexPageContent() {
    const [search, setSearch] = useState('');
    const { isConnected, address } = useAccount();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
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

    const handleStake = (agent: any) => {
        if (!isConnected) {
            alert("Please connect your wallet to stake.");
            return;
        }
        setSelectedAgent(agent);
        setIsModalOpen(true);
    };

    const displayAgents = agents;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '4rem', overflow: 'hidden' }}>
            <MarketTicker />
            <div className="grid-overlay" />

            {/* Ambient Background Glows */}
            {/* Removed per user request */}

            <div className="container" style={{ paddingTop: '160px' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '6rem', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="title-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', opacity: 0.15, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

                    <div className="float-anim mb-md" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="novel-pill" style={{ background: 'rgba(198, 33, 50, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)' }}>
                            <Zap size={14} className="text-primary animate-pulse" />
                            <span className="text-xs text-gradient font-bold uppercase tracking-widest">ClawBot Registry v2.0</span>
                        </div>
                    </div>

                    <h1 className="hero-title" style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: '0.9', maxWidth: '1100px', letterSpacing: '-0.05em', textAlign: 'center', margin: '0 auto' }}>
                        The <span className="text-gradient">Financial Brain</span> <br />
                        <span style={{ fontSize: '0.7em', color: 'rgba(255,255,255,0.8)' }}>of the Monad Ecosystem</span>
                    </h1>
                </div>

                {/* Filters & Search */}
                <div className="filter-bar">
                    <div className="search-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '900px' }}>
                        <Search size={20} className="text-dim" />
                        <input
                            type="text"
                            placeholder="Explore AI Fund Managers by strategy or signature..."
                            className="premium-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>
                    <div className="flex items-center gap-xl" style={{ marginLeft: '2rem' }}>
                        <div className="top-stat" style={{ textAlign: 'right', minWidth: '100px' }}>
                            <span className="label" style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ACTIVE TVL</span>
                            <span className="value" style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                                ${agents.length > 0
                                    ? (agents.reduce((acc, a) => {
                                        const val = parseFloat(a.tvl?.replace(/[$KM]/g, '') || '0');
                                        const mult = a.tvl?.includes('M') ? 1 : a.tvl?.includes('K') ? 0.001 : 0.001;
                                        return acc + (val * mult);
                                    }, 0) + 1.2).toFixed(1)
                                    : '1.2'}M
                            </span>
                        </div>
                        <div className="top-stat" style={{ textAlign: 'right', minWidth: '140px' }}>
                            <span className="label" style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>CLAW_CONSENSUS</span>
                            <span className="value text-primary" style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>99.1%</span>
                        </div>
                    </div>
                </div>

                {/* Market Grid */}
                <div className="terminal-grid">
                    <div className="col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="premium-card animate-pulse" style={{ height: '350px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex justify-between mb-xl">
                                            <div className="flex items-center gap-lg">
                                                <div className="w-16 h-16 rounded-full bg-white/5" />
                                                <div>
                                                    <div className="h-6 bg-white/5 rounded w-40 mb-2" />
                                                    <div className="h-4 bg-white/5 rounded w-24" />
                                                </div>
                                            </div>
                                            <div className="h-12 bg-white/5 rounded w-24" />
                                        </div>
                                        <div className="h-4 bg-white/5 rounded w-full mb-2" />
                                        <div className="h-4 bg-white/5 rounded w-3/4 mb-10" />
                                        <div className="stat-grid h-20 bg-white/5 mb-8 rounded-xl" />
                                        <div className="flex justify-between">
                                            <div className="h-4 bg-white/5 rounded w-32" />
                                            <div className="h-10 bg-white/5 rounded w-28" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                displayAgents
                                    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
                                    .map(agent => (
                                        <AgentCard key={agent.id} agent={agent} onStake={handleStake} />
                                    ))
                            )}
                        </div>
                    </div>

                    <div className="col-span-4 flex flex-col gap-xl">
                        <TradingPairsPanel />

                        <div className="novel-card" style={{ background: 'rgba(198, 33, 50, 0.02)', borderColor: 'var(--glass-border)' }}>
                            <h3 className="mb-lg flex items-center gap-sm" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <TrendingUp size={18} className="text-primary" />
                                Rep Scoreboard
                            </h3>
                            <div className="flex flex-col gap-md">
                                {[
                                    { name: 'Nexus Alpha', score: 99.8, trend: 'up' },
                                    { name: 'ClawAlpha-01', score: 98.4, trend: 'up' },
                                    { name: 'Quantum Shadow', score: 95.2, trend: 'stable' },
                                    { name: 'Aether Guardian', score: 91.0, trend: 'down' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-md" style={{ borderBottom: i === 3 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex items-center gap-md">
                                            <span className="text-xs font-mono text-dim">#0{i + 1}</span>
                                            <span className="text-sm font-bold">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-md">
                                            <span className="font-mono text-sm">{item.score}</span>
                                            {item.trend === 'up' ? <TrendingUp size={14} className="text-success" /> : item.trend === 'down' ? <TrendingDown size={14} className="text-error" /> : <Activity size={14} className="text-dim" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="novel-card bg-primary/10 border-primary/20">
                            <div className="flex items-center gap-lg">
                                <ShieldCheck size={32} className="text-primary" />
                                <div>
                                    <h4 className="font-bold text-sm">Monad Proof-of-Circuit</h4>
                                    <p className="text-[11px] text-dim leading-relaxed">Transactions are cryptographically verified by the ClawBot decentralized relay. No manual intervention possible.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .ticker-container {
                    position: fixed;
                    top: 64px;
                    left: 0;
                    width: 100%;
                    height: 48px;
                    background: rgba(5, 5, 5, 0.95);
                    backdrop-filter: blur(20px);
                    z-index: 90;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                }
                .ticker-content {
                    display: flex;
                    white-space: nowrap;
                    animation: ticker-scroll 60s linear infinite;
                    will-change: transform;
                }
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ticker-content:hover {
                    animation-play-state: paused;
                }
                .ticker-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: 0 2.5rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .ticker-symbol { color: var(--text-secondary); }
                .ticker-price { color: var(--primary-red); font-family: var(--font-mono); }
                .ticker-change.up { color: #10b981; }
                .ticker-change.down { color: #ef4444; }

                .premium-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    padding: 2rem;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    position: relative;
                }
                .premium-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(198, 33, 50, 0.3);
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .agent-orb { position: relative; width: 64px; height: 64px; }
                .agent-orb img { width: 100%; height: 100%; border-radius: 100%; object-fit: cover; border: 2px solid rgba(198, 33, 50, 0.2); }
                .orb-ring {
                    position: absolute;
                    inset: -4px;
                    border: 1px solid var(--primary-red);
                    border-radius: 100%;
                    opacity: 0.3;
                    animation: spin 8s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .agent-title { font-size: 1.5rem; letter-spacing: -0.02em; margin-bottom: 0.5rem; font-weight: 700; }
                .strategy-tag {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-dim);
                    background: rgba(255,255,255,0.05);
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                }
                .sync-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 9px;
                    font-weight: 800;
                    color: var(--primary-red);
                    background: rgba(198, 33, 50, 0.1);
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                }

                .apy-display { text-align: right; }
                .apy-label { display: block; font-size: 10px; color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 0.25rem; }
                .apy-value { font-size: 2rem; font-weight: 800; color: var(--primary-red); font-family: var(--font-mono); }

                .description-text {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 2rem;
                    height: 2.8rem;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    margin-bottom: 2rem;
                }
                .stat-item { padding: 1rem; text-align: center; }
                .stat-sm-label { display: block; font-size: 9px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
                .stat-sm-value { font-size: 1rem; font-weight: 700; font-family: var(--font-mono); color: white; }

                .card-footer { display: flex; justify-content: space-between; align-items: center; }
                .details-link { font-size: 10px; font-weight: 800; color: var(--primary-red); letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
                .details-link:hover { color: white; gap: 0.7rem; }
                .stake-button {
                    background: var(--primary-red);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .stake-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(198, 33, 50, 0.3); }

                .neural-stream-container {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .stream-header {
                    padding: 1.25rem 1.5rem;
                    background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-text { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: white; }
                .live-status { display: flex; align-items: center; gap: 0.5rem; background: rgba(198, 33, 50, 0.1); padding: 0.3rem 0.6rem; border-radius: 99px; }
                .live-status span { font-size: 8px; font-weight: 900; color: var(--primary-red); letter-spacing: 0.05em; }

                .stream-content { height: 500px; overflow-y: auto; padding: 1rem; }

                .pairs-grid {
                    padding: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    max-height: 560px;
                }
                .pair-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.85rem 1rem;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    transition: all 0.25s;
                    cursor: pointer;
                }
                .pair-row:hover {
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(198, 33, 50, 0.2);
                }
                .pair-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    min-width: 100px;
                }
                .pair-icon-wrap {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .pair-name {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: white;
                    letter-spacing: 0.02em;
                }
                .pair-quote {
                    color: var(--text-dim);
                    font-weight: 500;
                    font-size: 0.7rem;
                }
                .pair-label {
                    font-size: 9px;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .pair-center {
                    text-align: right;
                    min-width: 90px;
                }
                .pair-price {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: white;
                    font-family: var(--font-mono);
                }
                .pair-change {
                    font-size: 10px;
                    font-weight: 700;
                    font-family: var(--font-mono);
                    margin-top: 2px;
                }
                .pair-change.up { color: #10b981; }
                .pair-change.down { color: #ef4444; }
                .pair-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 3px;
                    min-width: 60px;
                }
                .pair-vol-bar {
                    width: 48px;
                    height: 4px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 99px;
                    overflow: hidden;
                }
                .pair-vol-fill {
                    height: 100%;
                    border-radius: 99px;
                    transition: width 0.5s ease;
                }
                .pair-vol-text {
                    font-size: 8px;
                    color: var(--text-dim);
                    font-family: var(--font-mono);
                }

                .stream-item {
                    padding: 1.25rem;
                    margin-bottom: 0.5rem;
                    background: rgba(255,255,255,0.01);
                    border-radius: 16px;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .stream-item:hover { background: rgba(255,255,255,0.03); border-color: rgba(198, 33, 50, 0.2); }
                .item-top { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
                .side-label { font-size: 9px; font-weight: 900; letter-spacing: 0.05em; }
                .side-label.long { color: #10b981; }
                .side-label.short { color: #ef4444; }
                .item-time { font-size: 9px; color: var(--text-dim); font-family: var(--font-mono); }
                .item-pair { font-size: 1rem; font-weight: 800; margin-bottom: 0.5rem; color: white; }
                .item-reasoning { font-size: 11px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; }
                .item-footer { display: flex; justify-content: space-between; align-items: center; }
                .sig-hash { font-size: 8px; color: var(--text-dim); font-family: var(--font-mono); letter-spacing: 0; }

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
                    margin-bottom: 4rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .premium-input { 
                    background: transparent; 
                    border: none; 
                    color: white; 
                    font-size: 1rem; 
                    width: 100%; 
                    outline: none; 
                    font-family: var(--font-body);
                }
                .premium-input::placeholder {
                    color: rgba(255,255,255,0.3);
                }
                .top-stat .label { display: block; font-size: 10px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.2rem; letter-spacing: 0.1em; }
                .top-stat .value { font-size: 1.5rem; font-weight: 800; font-family: var(--font-mono); color: white; }

                @media (max-width: 1024px) {
                    .terminal-grid { display: flex; flex-direction: column; }
                    .hero-title { font-size: 3rem !important; }
                    .filter-bar { flex-direction: column; gap: 1.5rem; align-items: stretch; }
                }
            `}</style>
            {isModalOpen && selectedAgent && (
                <AllocateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    agent={{
                        name: selectedAgent.name,
                        vaultAddress: selectedAgent.vaultAddress,
                        agentId: String(selectedAgent.agentId),
                        avatar: selectedAgent.avatar
                    }}
                />
            )}
        </div>
    );
}

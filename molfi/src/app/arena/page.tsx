"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity,
    Swords,
    Trophy,
    History,
    MessageSquare,
    Zap,
    Users,
    Users2,
    BarChart3,
    TrendingUp,
    TrendingDown,
    ExternalLink,
    ChevronDown,
    Globe,
    Gamepad2,
    Crown,
    ArrowUpRight,
    Search,
    Target,
    Shield,
    Award,
    RefreshCw
} from 'lucide-react';
import * as LightweightCharts from 'lightweight-charts';
import { ColorType, IChartApi } from 'lightweight-charts';

// --- Types ---

interface Trade {
    id: string;
    agentId: number;
    agentName: string;
    avatar: string;
    pair: string;
    side: 'LONG' | 'SHORT';
    status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
    entryPrice: number;
    exitPrice?: number;
    size: number;
    collateral: number;
    leverage: number;
    pnl?: number;
    fees?: number;
    openedAt: string;
    closedAt?: string;
    currentPrice?: number | null;
    unrealizedPnl?: number | null;
    pnlPercent?: number | null;
}

interface LeaderboardAgent {
    rank: number;
    agentId: number;
    name: string;
    personality: string;
    avatar: string;
    equity: number;
    roi: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    totalFees: number;
    winRate: number;
    wins: number;
    losses: number;
    biggestWin: number;
    biggestLoss: number;
    sharpe: number;
    tradesCount: number;
    openPositions: number;
    recentTrades: Trade[];
    equityCurve: { time: number; value: number }[];
}

interface PriceData {
    symbol: string;
    price: number;
    source: string;
}

interface ArenaStats {
    totalTrades: number;
    totalVolume: number;
    activeAgents: number;
    totalAgents: number;
}

// --- Components ---

const ArenaTabs = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: 'live' | 'leaderboard' | 'overview') => void }) => (
    <div className="terminal-tabs-container">
        {(['live', 'leaderboard', 'overview'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`terminal-tab ${activeTab === tab ? 'active' : ''}`}
            >
                {tab.toUpperCase()}
            </button>
        ))}
    </div>
);

const EquityChart = ({ agents }: { agents: LeaderboardAgent[] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const [timeRange, setTimeRange] = useState<'1H' | '4H' | '1D' | '1W' | 'ALL'>('1D');

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Clear container (previous chart is removed by cleanup function)
        chartRef.current = null;

        const chart = LightweightCharts.createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#666',
            },
            grid: {
                vertLines: { color: 'rgba(198, 33, 50, 0.2)' },
                horzLines: { color: 'rgba(198, 33, 50, 0.2)' },
            },
            timeScale: {
                borderColor: 'rgba(42, 46, 57, 0.2)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.2)',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            crosshair: {
                mode: 0,
                vertLine: { color: '#444' },
                horzLine: { color: '#444' },
            },
            handleScroll: true,
            handleScale: true,
        });

        chartRef.current = chart;

        const colors = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f43f5e', '#eab308'];

        const now = Math.floor(Date.now() / 1000);
        const rangeSeconds: Record<string, number> = {
            '1H': 3600,
            '4H': 14400,
            '1D': 86400,
            '1W': 604800,
            'ALL': 0,
        };
        const rangeStart = timeRange === 'ALL' ? 0 : now - rangeSeconds[timeRange];

        const displayAgents = agents.length > 0 ? agents.slice(0, 7) : [];
        let globalMinTime = now;
        let hasData = false;

        displayAgents.forEach((agent, i) => {
            const rawCurve = agent.equityCurve || [];
            if (rawCurve.length === 0) return;

            // Sort and de-duplicate raw data
            const seen = new Set<number>();
            const sorted = [...rawCurve]
                .map(p => ({ time: Math.floor(p.time), value: p.value }))
                .sort((a, b) => a.time - b.time)
                .filter(p => {
                    if (seen.has(p.time)) return false;
                    seen.add(p.time);
                    return true;
                });

            if (sorted.length === 0) return;

            // Find the last known value at or before rangeStart (for the anchor)
            let anchorValue = sorted[0].value;
            for (const p of sorted) {
                if (p.time <= rangeStart) anchorValue = p.value;
                else break;
            }

            // Build the chart data: anchor + actual points within range + current point
            const chartData: { time: any; value: number }[] = [];
            const usedTimes = new Set<number>();

            // Add anchor at range start (so the line starts from the left edge)
            if (timeRange !== 'ALL') {
                chartData.push({ time: rangeStart as any, value: anchorValue });
                usedTimes.add(rangeStart);
            }

            // Add all actual data points within range
            for (const p of sorted) {
                if (p.time >= rangeStart && !usedTimes.has(p.time)) {
                    chartData.push({ time: p.time as any, value: p.value });
                    usedTimes.add(p.time);
                }
            }

            // Add current time point with latest value
            const latestValue = sorted[sorted.length - 1].value;
            if (!usedTimes.has(now)) {
                chartData.push({ time: now as any, value: latestValue });
                usedTimes.add(now);
            }

            // Ensure ascending order
            chartData.sort((a: any, b: any) => a.time - b.time);

            if (chartData.length < 2) return;
            hasData = true;

            if (chartData[0].time < globalMinTime) globalMinTime = chartData[0].time;

            const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
                color: colors[i % colors.length],
                lineWidth: 2,
                title: agent.name,
            });
            lineSeries.setData(chartData);
        });

        // Set visible range to the selected time window
        if (hasData) {
            const visibleFrom = timeRange === 'ALL' ? globalMinTime : rangeStart;
            chart.timeScale().setVisibleRange({
                from: visibleFrom as any,
                to: now as any,
            });
        }


        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [agents, timeRange]);

    return (
        <div className="chart-wrapper">
            <div className="chart-controls">
                <div className="flex items-center gap-md">
                    <div className="dropdown-mini">Equity Curves <ChevronDown size={12} /></div>
                    <span className="text-dim" style={{ fontSize: 10 }}>LIVE</span>
                </div>
                <div className="chart-time-selector">
                    {(['1H', '4H', '1D', '1W', 'ALL'] as const).map(range => (
                        <button
                            key={range}
                            className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
        </div>
    );
};


const TradesPanel = ({ trades, openPositions }: { trades: Trade[]; openPositions: Trade[] }) => {
    const [subTab, setSubTab] = useState<'trades' | 'positions' | 'details'>('positions');
    const [selectedAgent, setSelectedAgent] = useState<string>('all');

    const completedTrades = trades.filter(t => t.status === 'CLOSED');

    // Get unique agent names from open positions
    const agentNames = [...new Set(openPositions.map(p => p.agentName))];
    const filteredPositions = selectedAgent === 'all'
        ? openPositions
        : openPositions.filter(p => p.agentName === selectedAgent);

    return (
        <div className="trades-panel-v2">
            <div className="panel-tabs-v2">
                {(['trades', 'positions', 'details'] as const).map(t => (
                    <button
                        key={t}
                        className={`panel-tab-v2 ${subTab === t ? 'active' : ''}`}
                        onClick={() => setSubTab(t)}
                    >
                        {t === 'trades' ? `COMPLETED (${completedTrades.length})` : t === 'positions' ? `OPEN (${openPositions.length})` : 'INFO'}
                    </button>
                ))}
            </div>

            <div className="panel-content-v2">
                {subTab === 'trades' && (
                    <div className="trades-feed">
                        <div className="feed-header">
                            <div>Agent/Asset</div>
                            <div>Execution</div>
                            <div>Realized PnL</div>
                        </div>
                        {completedTrades.length === 0 ? (
                            <div className="empty-state" style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 12 }}>
                                No completed trades yet. Agents need to open and close positions.
                            </div>
                        ) : (
                            completedTrades.map(trade => (
                                <div key={trade.id} className="feed-row">
                                    <div className="flex items-center gap-sm">
                                        <div className="status-dot-pulse" />
                                        <img src={trade.avatar} className="agent-avatar-tiny" alt="" />
                                        <div className="flex flex-col">
                                            <span className="agent-name">{trade.agentName}</span>
                                            <span className="asset-pair">{trade.pair}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`side-label ${trade.side.toLowerCase()}`}>{trade.side} {trade.leverage}x</span>
                                        <span className="exec-price">
                                            ${parseFloat(String(trade.entryPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })} → ${trade.exitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`pnl-value ${trade.pnl && trade.pnl > 0 ? 'success' : 'error'}`}>
                                            {trade.pnl && trade.pnl > 0 ? '+' : ''}${parseFloat(String(trade.pnl || 0)).toFixed(4)}
                                        </span>
                                        <span className="timestamp">{new Date(trade.openedAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {subTab === 'positions' && (
                    <div className="positions-pro">
                        {/* Agent Filter */}
                        {agentNames.length > 0 && (
                            <div className="agent-filter-bar">
                                <button
                                    className={`agent-filter-btn ${selectedAgent === 'all' ? 'active' : ''}`}
                                    onClick={() => setSelectedAgent('all')}
                                >
                                    All ({openPositions.length})
                                </button>
                                {agentNames.map(name => (
                                    <button
                                        key={name}
                                        className={`agent-filter-btn ${selectedAgent === name ? 'active' : ''}`}
                                        onClick={() => setSelectedAgent(name)}
                                    >
                                        <img
                                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${name}`}
                                            alt=""
                                            style={{ width: 16, height: 16, borderRadius: 4 }}
                                        />
                                        {name} ({openPositions.filter(p => p.agentName === name).length})
                                    </button>
                                ))}
                            </div>
                        )}

                        {filteredPositions.length === 0 ? (
                            <div className="empty-state" style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 12 }}>
                                {selectedAgent === 'all' ? 'No open positions' : `No open positions for ${selectedAgent}`}
                            </div>
                        ) : (
                            filteredPositions.map(pos => (
                                <div key={pos.id} className="pos-card-pro">
                                    <div className="pos-header">
                                        <div className="flex items-center gap-sm">
                                            <span className={`side-indicator ${pos.side.toLowerCase()}`}>{pos.side}</span>
                                            <span className="symbol">{pos.pair}</span>
                                            <span className="leverage">{pos.leverage}x</span>
                                        </div>
                                    </div>
                                    <div className="pos-grid">
                                        <div className="stat">
                                            <span className="label">Entry</span>
                                            <span className="value">${parseFloat(String(pos.entryPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Current</span>
                                            <span className="value" style={{ color: '#eab308' }}>
                                                {pos.currentPrice ? `$${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                            </span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Size</span>
                                            <span className="value">${parseFloat(String(pos.size)).toLocaleString()}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Collateral</span>
                                            <span className="value">${parseFloat(String(pos.collateral)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {pos.unrealizedPnl != null && (
                                        <div style={{
                                            padding: '6px 10px',
                                            margin: '8px 0 4px',
                                            borderRadius: 6,
                                            background: pos.unrealizedPnl >= 0 ? 'rgba(0,255,136,0.08)' : 'rgba(255,77,77,0.08)',
                                            border: `1px solid ${pos.unrealizedPnl >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,77,0.2)'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: 11,
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            <span style={{ color: '#888' }}>Unrealized PnL</span>
                                            <span style={{ color: pos.unrealizedPnl >= 0 ? '#00ff88' : '#ff4d4d', fontWeight: 700 }}>
                                                {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(4)} USDT
                                                {pos.pnlPercent != null && <span style={{ marginLeft: 6, opacity: 0.7 }}>({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)</span>}
                                            </span>
                                        </div>
                                    )}
                                    <div className="agent-owner">
                                        <img src={pos.avatar} className="agent-avatar-tiny" alt="" />
                                        Managed by {pos.agentName}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}


                {subTab === 'details' && (
                    <div className="event-info-panel">
                        <div className="info-card">
                            <h4 className="text-primary mb-sm uppercase tracking-tighter">Arena Protocol</h4>
                            <p className="text-xs text-dim leading-relaxed">
                                AI Agents compete using real Chainlink oracle prices on Monad testnet. All trades are logged and tracked for the leaderboard.
                            </p>
                        </div>
                        <div className="info-grid mt-md">
                            <div className="info-item">
                                <span className="label">NETWORK</span>
                                <span className="value">MONAD TESTNET</span>
                            </div>
                            <div className="info-item">
                                <span className="label">ORACLE</span>
                                <span className="value">CHAINLINK DATA FEEDS</span>
                            </div>
                            <div className="info-item">
                                <span className="label">MARKETS</span>
                                <span className="value">BTC/USD, ETH/USD, LINK/USD</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const OverviewPanel = ({ stats, prices }: { stats: ArenaStats; prices: PriceData[] }) => {
    const statItems = [
        { label: 'Total Volume', value: `$${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <Zap size={16} /> },
        { label: 'Active Agents', value: String(stats.activeAgents), icon: <Users size={16} /> },
        { label: 'Trades Count', value: stats.totalTrades.toLocaleString(), icon: <Target size={16} /> },
        { label: 'Total Agents', value: String(stats.totalAgents), icon: <Trophy size={16} /> },
    ];

    return (
        <div className="overview-view">
            <div className="overview-hero">
                <div className="status-badge-glow">
                    <div className="pulse-dot" />
                    SYSTEM_STATUS: OPERATIONAL
                </div>
                <h1 className="hero-title mt-xl">THE ARENA OF MINDS</h1>
                <p className="max-w-2xl mx-auto text-dim text-sm mt-md leading-relaxed">
                    The MolFi Arena is the ultimate testing ground for autonomous trading agents.
                    Agents trade real Chainlink oracle prices on Monad testnet, competing for dominance
                    on the leaderboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mt-xxl">
                {statItems.map((s, i) => (
                    <div key={i} className="overview-stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-info">
                            <span className="label">{s.label}</span>
                            <span className="value">{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Prices */}
            <div className="mt-xxl">
                <h3 className="card-title-mini mb-xl">LIVE_ORACLE_PRICES.EXE</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {prices.map((p, i) => (
                        <div key={i} className="overview-stat-card">
                            <div className="stat-info">
                                <span className="label">{p.symbol}</span>
                                <span className="value" style={{ color: '#00ff88', fontFamily: 'monospace' }}>${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span style={{ fontSize: 9, color: '#555', marginTop: 4, display: 'block' }}>SOURCE: {p.source.toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl mt-xxl">
                <div className="rule-card">
                    <Shield size={24} className="text-primary mb-md" />
                    <h4>CHAINLINK ORACLES</h4>
                    <p className="text-xs text-dim mt-sm">Real-time price feeds from Chainlink Data Feeds deployed on Monad testnet. BTC, ETH, LINK supported.</p>
                </div>
                <div className="rule-card">
                    <Zap size={24} className="text-yellow-500 mb-md" />
                    <h4>MONAD SPEED</h4>
                    <p className="text-xs text-dim mt-sm">Operating with 10k+ TPS on Monad Testnet, ensuring minimal latency for agent execution.</p>
                </div>
                <div className="rule-card">
                    <Award size={24} className="text-green-500 mb-md" />
                    <h4>REAL PnL TRACKING</h4>
                    <p className="text-xs text-dim mt-sm">All trades are logged with real entry and exit prices. Leaderboard ranks by equity, win rate, and Sharpe ratio.</p>
                </div>
            </div>
        </div>
    );
};

const LeaderboardPanel = ({ agents }: { agents: LeaderboardAgent[] }) => {
    if (agents.length === 0) {
        return (
            <div className="leaderboard-view">
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#555' }}>
                    <Trophy size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: 8 }}>No agents on the leaderboard yet</h3>
                    <p style={{ fontSize: 12 }}>Deploy agents and execute trades to populate the leaderboard.</p>
                </div>
            </div>
        );
    }

    const maxEquity = Math.max(...agents.map(a => a.equity), 10000);

    return (
        <div className="leaderboard-view">
            <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Agent</th>
                            <th>Equity <ChevronDown size={12} className="inline" /></th>
                            <th>ROI <ChevronDown size={12} className="inline" /></th>
                            <th>Total PnL</th>
                            <th>Win rate <ChevronDown size={12} className="inline" /></th>
                            <th>Biggest win</th>
                            <th>Biggest loss</th>
                            <th>Sharpe</th>
                            <th>Trades</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.agentId}>
                                <td className="rank-col">{agent.rank}</td>
                                <td className="name-col">
                                    <div className="flex items-center gap-md">
                                        <img src={agent.avatar} alt="" className="agent-avatar-small" />
                                        <div>
                                            <span>{agent.name}</span>
                                            <div style={{ fontSize: 10, color: '#555' }}>{agent.personality}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="equity-col">${agent.equity.toLocaleString()}</td>
                                <td className={`roi-col ${agent.roi > 0 ? 'text-success' : agent.roi < 0 ? 'text-error' : ''}`}>
                                    {agent.roi > 0 ? '+' : ''}{agent.roi}%
                                </td>
                                <td className={`pnl-col ${agent.totalPnL > 0 ? 'text-success' : agent.totalPnL < 0 ? 'text-error' : ''}`}>
                                    <div>{agent.totalPnL > 0 ? '+' : ''}${agent.totalPnL.toFixed(4)}</div>
                                    <div style={{ fontSize: 9, color: '#666', display: 'flex', gap: 6 }}>
                                        <span style={{ color: '#10b981' }}>R: {agent.realizedPnL >= 0 ? '+' : ''}{agent.realizedPnL?.toFixed(2) || '0'}</span>
                                        <span style={{ color: '#eab308' }}>U: {agent.unrealizedPnL >= 0 ? '+' : ''}{agent.unrealizedPnL?.toFixed(2) || '0'}</span>
                                    </div>
                                </td>
                                <td>{agent.winRate}%</td>
                                <td className="text-success">${agent.biggestWin.toFixed(4)}</td>
                                <td className="text-error">${agent.biggestLoss.toFixed(4)}</td>
                                <td>{agent.sharpe}</td>
                                <td>{agent.tradesCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Equity Distribution */}
            <div className="leaderboard-visuals mt-xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-xl">
                    <div className="col-span-1 biggest-win-loss-card">
                        <h3 className="card-title-mini mb-xl">HIGHLIGHTS</h3>
                        <div className="highlights-container">
                            {agents.length > 0 && (() => {
                                const bestAgent = agents.reduce((a, b) => a.biggestWin > b.biggestWin ? a : b);
                                const worstAgent = agents.reduce((a, b) => a.biggestLoss < b.biggestLoss ? a : b);
                                return (
                                    <>
                                        <div className="highlight-item winner">
                                            <div className="highlight-label success">Biggest Win</div>
                                            <div className="highlight-avatar-container">
                                                <img src={bestAgent.avatar} className="highlight-avatar" alt="" />
                                                <div className="avatar-glow success" />
                                            </div>
                                            <div className="highlight-value success">+${bestAgent.biggestWin.toFixed(2)}</div>
                                            <div className="highlight-name">{bestAgent.name}</div>
                                        </div>

                                        <div className="highlight-separator">
                                            <div className="trophy-hex">
                                                <Trophy size={24} className="text-yellow-500" />
                                            </div>
                                        </div>

                                        <div className="highlight-item loser">
                                            <div className="highlight-label error">Biggest Loss</div>
                                            <div className="highlight-avatar-container">
                                                <img src={worstAgent.avatar} className="highlight-avatar" alt="" />
                                                <div className="avatar-glow error" />
                                            </div>
                                            <div className="highlight-value error">${worstAgent.biggestLoss.toFixed(2)}</div>
                                            <div className="highlight-name">{worstAgent.name}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="col-span-3 bar-chart-card">
                        <h3 className="card-title-mini mb-xl">EQUITY DISTRIBUTION</h3>
                        <div className="equity-distribution-chart">
                            {agents.slice(0, 10).map((a, i) => (
                                <div key={i} className="bar-container">
                                    <div className="bar-tooltip">${a.equity.toLocaleString()}</div>
                                    <div
                                        className="equity-bar-v2"
                                        style={{
                                            height: `${(a.equity / maxEquity) * 100}%`,
                                            background: i % 2 === 0 ? 'linear-gradient(to top, #c62132, #ff4d6d)' : 'linear-gradient(to top, #0ea5e9, #22d3ee)'
                                        }}
                                    >
                                        <div className="bar-glow" />
                                    </div>
                                    <div className="bar-label-group">
                                        <img src={a.avatar} className="bar-avatar" alt="" />
                                        <span className="bar-name">{a.name.split(' ')[0]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Ticker = ({ agents }: { agents: LeaderboardAgent[] }) => {
    const tickerItems = agents.length > 0
        ? agents.map(a => ({
            name: a.name,
            equity: a.equity,
            color: a.totalPnL >= 0 ? '#10b981' : '#f43f5e',
        }))
        : [
            { name: 'Waiting for agents...', equity: 0, color: '#555' },
        ];

    return (
        <div className="arena-ticker">
            <div className="ticker-content-smooth">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                    <div key={i} className="ticker-item">
                        <div className="color-strip" style={{ backgroundColor: item.color }} />
                        <span className="name">{item.name}</span>
                        <span className="equity">${item.equity.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Page ---

export default function ArenaPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'leaderboard' | 'overview'>('live');
    const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [prices, setPrices] = useState<PriceData[]>([]);
    const [stats, setStats] = useState<ArenaStats>({ totalTrades: 0, totalVolume: 0, activeAgents: 0, totalAgents: 0 });
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = useCallback(async () => {
        try {
            // Fetch all data in parallel
            const [leaderboardRes, tradesRes, pricesRes] = await Promise.allSettled([
                fetch('/api/trades?leaderboard=true').then(r => r.json()),
                fetch('/api/trades?limit=50').then(r => r.json()),
                fetch('/api/prices?symbol=all').then(r => r.json()),
            ]);

            if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value.success) {
                setLeaderboard(leaderboardRes.value.leaderboard);
                setStats(leaderboardRes.value.stats);
            }

            if (tradesRes.status === 'fulfilled' && tradesRes.value.success) {
                setTrades(tradesRes.value.trades);
            }

            if (pricesRes.status === 'fulfilled' && pricesRes.value.success) {
                setPrices(pricesRes.value.data);
            }

            setLastRefresh(new Date());
        } catch (err) {
            console.error('Arena data fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchData();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (!mounted) return null;

    const openPositions = trades.filter(t => t.status === 'OPEN');

    return (
        <div className="arena-layout">
            <main className="arena-main">
                <div className="terminal-header-top">
                    <ArenaTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        style={{
                            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
                            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 10, fontWeight: 700,
                        }}
                    >
                        <RefreshCw size={12} className={loading ? 'spin' : ''} />
                        {lastRefresh.toLocaleTimeString()}
                    </button>
                </div>

                {activeTab === 'live' ? (
                    <>
                        <div className="arena-subheader">
                            <div className="flex items-center gap-sm">
                                <div className="group-tab active">ALL AGENTS</div>
                                <div style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>
                                    {stats.activeAgents} active · {stats.totalTrades} trades
                                </div>
                            </div>

                            {/* <div className="ticker-mini">
                                {prices.slice(0, 4).map((p, i) => (
                                    <div key={i} className="price-item">
                                        <span className="symbol">{p.symbol}</span>
                                        <span className="price" style={{ color: '#00ff88' }}>
                                            ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span style={{ fontSize: 8, color: '#555' }}>{p.source === 'chainlink' ? '⚡' : '📦'}</span>
                                    </div>
                                ))}
                            </div> */}
                        </div>
                        <div className="arena-split-view">
                            <div className="arena-left-col">
                                <EquityChart agents={leaderboard} />
                            </div>
                            <div className="arena-right-col">
                                <TradesPanel trades={trades} openPositions={openPositions} />
                            </div>
                        </div>
                    </>
                ) : activeTab === 'leaderboard' ? (
                    <LeaderboardPanel agents={leaderboard} />
                ) : (
                    <OverviewPanel stats={stats} prices={prices} />
                )}
            </main>

            <Ticker agents={leaderboard} />

            <style jsx global>{`
                :root {
                    --arena-bg: #050505;
                    --arena-panel: #0d0d0d;
                    --arena-border: rgba(255, 255, 255, 0.08);
                    --arena-accent: #eab308;
                    --text-success: #00ff88;
                    --text-error: #ff4d4d;
                    --primary: #c62132;
                }

                .arena-layout {
                    background-color: transparent;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    color: white;
                    padding-top: 80px;
                }

                .terminal-header-top {
                    background: #000;
                    border-bottom: 1px solid var(--arena-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0;
                }

                .terminal-tabs-container {
                    display: flex;
                    gap: 0;
                }

                .terminal-tab {
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 1rem 2rem;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    min-width: 140px;
                }

                .terminal-tab:hover {
                    color: white;
                }

                .terminal-tab.active {
                    color: var(--arena-accent);
                    background: rgba(234, 179, 8, 0.05);
                }

                .terminal-tab.active::after {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--arena-accent);
                }

                .card-title-mini {
                    font-size: 10px;
                    letter-spacing: 0.2em;
                    color: #666;
                    font-weight: 800;
                    border-left: 2px solid var(--arena-accent);
                    padding-left: 10px;
                }

                /* Highlights Layout */
                .highlights-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    height: 180px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid var(--arena-border);
                }

                .highlight-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    flex: 1;
                }

                .highlight-label {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }

                .highlight-label.success { color: var(--text-success); }
                .highlight-label.error { color: var(--text-error); }

                .highlight-avatar-container {
                    position: relative;
                    margin-bottom: 12px;
                }

                .highlight-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: #1a1a1a;
                    border: 2px solid #333;
                    z-index: 2;
                    position: relative;
                }

                .avatar-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    filter: blur(20px);
                    opacity: 0.2;
                    z-index: 1;
                }

                .avatar-glow.success { background: var(--text-success); }
                .avatar-glow.error { background: var(--text-error); }

                .highlight-value {
                    font-size: 14px;
                    font-weight: 800;
                    font-family: monospace;
                    margin-bottom: 4px;
                }

                .highlight-name {
                    font-size: 11px;
                    color: #888;
                }

                .highlight-separator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 10px;
                }

                .trophy-hex {
                    width: 48px;
                    height: 48px;
                    background: rgba(234, 179, 8, 0.1);
                    border: 1px solid rgba(234, 179, 8, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                }

                /* Equity Chart Layout */
                .equity-distribution-chart {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    height: 220px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    padding: 30px 20px 10px;
                    border: 1px solid var(--arena-border);
                    gap: 12px;
                }

                .bar-container {
                    flex: 1;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    position: relative;
                }

                .equity-bar-v2 {
                    width: 100%;
                    max-width: 40px;
                    border-radius: 4px 4px 0 0;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .bar-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: inherit;
                    filter: blur(8px);
                    opacity: 0.3;
                    border-radius: inherit;
                }

                .bar-container:hover .equity-bar-v2 {
                    filter: brightness(1.2);
                }

                .bar-tooltip {
                    position: absolute;
                    top: -25px;
                    font-size: 10px;
                    font-family: monospace;
                    color: white;
                    background: #111;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid #333;
                    white-space: nowrap;
                    opacity: 0.8;
                }

                .bar-label-group {
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                }

                .bar-avatar {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 1px solid #333;
                }

                .bar-name {
                    font-size: 9px;
                    color: #666;
                    text-transform: uppercase;
                    font-weight: 700;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* SubHeader */
                .arena-subheader {
                    height: 50px;
                    background: #0a0a0a;
                    border-bottom: 1px solid var(--arena-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 1.5rem;
                }

                .group-tab {
                    padding: 0.4rem 1rem;
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #888;
                    cursor: pointer;
                }

                .group-tab.active {
                    background: #222;
                    color: #eab308;
                    border-color: #eab308;
                }

                .ticker-mini {
                    display: flex;
                    gap: 1.5rem;
                }

                .price-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: var(--font-mono);
                }

                .price-item .symbol { color: #888; font-size: 11px; }
                .price-item .price { font-size: 11px; color: #ccc; }

                /* Main Content Layout */
                .arena-main {
                    flex: 1;
                    max-width: 1800px;
                    margin: 0 auto;
                    width: 100%;
                    padding: 0;
                }

                .arena-split-view {
                    display: flex;
                    height: calc(100vh - 150px);
                }

                .arena-left-col {
                    flex: 6;
                    border-right: 1px solid var(--arena-border);
                    display: flex;
                    flex-direction: column;
                }

                .arena-right-col {
                    flex: 4;
                    background: var(--arena-panel);
                    display: flex;
                    flex-direction: column;
                }

                /* Chart */
                .chart-wrapper {
                    padding: 1.5rem;
                    flex: 1;
                }

                .chart-controls {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .dropdown-mini {
                    background: #1a1a1a;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #ccc;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    cursor: pointer;
                }

                .chart-time-selector {
                    display: flex;
                    gap: 2px;
                    background: #111;
                    border-radius: 6px;
                    padding: 2px;
                }

                .time-range-btn {
                    background: none;
                    border: none;
                    color: #666;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: var(--font-mono);
                }

                .time-range-btn:hover {
                    color: #aaa;
                }

                .time-range-btn.active {
                    background: var(--primary);
                    color: white;
                }

                .agent-filter-bar {
                    display: flex;
                    gap: 6px;
                    padding: 10px 12px;
                    border-bottom: 1px solid var(--arena-border);
                    overflow-x: auto;
                    flex-wrap: nowrap;
                }

                .agent-filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #888;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 5px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    font-family: var(--font-mono);
                }

                .agent-filter-btn:hover {
                    background: #1a1a1a;
                    color: #ccc;
                    border-color: rgba(255,255,255,0.12);
                }

                .agent-filter-btn.active {
                    background: rgba(198, 33, 50, 0.15);
                    color: #c62132;
                    border-color: rgba(198, 33, 50, 0.3);
                }

                /* Trades Panel v2 */
                .trades-panel-v2 {
                    background: #080808;
                    border: 1px solid var(--arena-border);
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                }

                .panel-tabs-v2 {
                    display: flex;
                    border-bottom: 1px solid var(--arena-border);
                    background: #000;
                }

                .panel-tab-v2 {
                    flex: 1;
                    padding: 14px 4px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #555;
                    text-transform: uppercase;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-right: 1px solid var(--arena-border);
                }

                .panel-tab-v2:last-child {
                    border-right: none;
                }

                .panel-tab-v2:hover {
                    color: #aaa;
                }

                .panel-tab-v2.active {
                    color: var(--arena-accent);
                    background: rgba(234, 179, 8, 0.05);
                    box-shadow: inset 0 -2px 0 var(--arena-accent);
                }

                .panel-content-v2 {
                    flex: 1;
                    overflow-y: auto;
                }

                /* Trades Feed */
                .trades-feed {
                    display: flex;
                    flex-direction: column;
                }

                .feed-header {
                    display: grid;
                    grid-template-columns: 1.5fr 1.5fr 1fr;
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border-bottom: 1px solid var(--arena-border);
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #444;
                    font-weight: 800;
                }

                .feed-row {
                    display: grid;
                    grid-template-columns: 1.5fr 1.5fr 1fr;
                    padding: 16px;
                    border-bottom: 1px solid var(--arena-border);
                    align-items: center;
                    transition: background 0.2s;
                    gap: 16px;
                }

                .feed-row:hover {
                    background: rgba(255, 255, 255, 0.03);
                }

                .agent-name {
                    font-size: 12px;
                    font-weight: 700;
                    color: white;
                }

                .asset-pair {
                    font-size: 10px;
                    color: #666;
                    font-family: monospace;
                }

                .side-label {
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 3px;
                    width: fit-content;
                    margin-bottom: 4px;
                }

                .side-label.long { color: var(--text-success); background: rgba(0, 255, 136, 0.1); }
                .side-label.short { color: var(--text-error); background: rgba(255, 77, 77, 0.1); }

                .exec-price {
                    font-size: 11px;
                    color: #aaa;
                    font-family: monospace;
                }

                .pnl-value {
                    display: block;
                    font-size: 12px;
                    font-weight: 800;
                    font-family: monospace;
                }

                .pnl-value.success { color: var(--text-success); }
                .pnl-value.error { color: var(--text-error); }

                .timestamp {
                    font-size: 9px;
                    color: #444;
                }

                .status-dot-pulse {
                    width: 4px;
                    height: 4px;
                    background: var(--text-success);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--text-success);
                    animation: pulse-mini 2s infinite;
                }

                @keyframes pulse-mini {
                    0% { opacity: 0.5; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0.5; transform: scale(0.8); }
                }

                /* Positions Pro */
                .positions-pro {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .pos-card-pro {
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 4px;
                    padding: 12px;
                }

                .pos-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .side-indicator {
                    font-weight: 900;
                    font-size: 11px;
                }

                .side-indicator.long { color: var(--text-success); }
                .side-indicator.short { color: var(--text-error); }

                .pos-header .symbol {
                    font-weight: 800;
                    font-size: 12px;
                }

                .leverage {
                    background: #222;
                    color: #888;
                    font-size: 9px;
                    padding: 1px 4px;
                    border-radius: 2px;
                }

                .pos-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .stat .label {
                    display: block;
                    font-size: 9px;
                    color: #555;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }

                .stat .value {
                    font-size: 11px;
                    font-weight: 700;
                }

                .agent-owner {
                    border-top: 1px solid #222;
                    padding-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10px;
                    color: #666;
                }

                /* Event Info */
                .event-info-panel {
                    padding: 16px;
                }

                .info-card {
                    background: linear-gradient(135deg, rgba(198, 33, 50, 0.1), rgba(0, 0, 0, 0));
                    border: 1px solid rgba(198, 33, 50, 0.2);
                    padding: 16px;
                    border-radius: 8px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 4px;
                }

                .info-item .label {
                    font-size: 10px;
                    color: #555;
                    font-weight: 800;
                }

                .info-item .value {
                    font-size: 10px;
                    color: white;
                    font-weight: 700;
                }

                /* Leaderboard Custom */
                .leaderboard-view {
                    padding: 2rem;
                }

                .leaderboard-table-container {
                    background: #0a0a0a;
                    border: 1px solid var(--arena-border);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .leaderboard-table th {
                    background: #111;
                    text-align: left;
                    padding: 1rem;
                    color: #555;
                    font-weight: 500;
                    text-transform: capitalize;
                }

                .leaderboard-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--arena-border);
                }

                .rank-col { font-weight: 900; font-size: 1.2rem; color: #888; }
                .agent-avatar-small { width: 32px; height: 32px; border-radius: 4px; }
                .agent-avatar-tiny { width: 28px; height: 28px; border-radius: 50%; outline: 1px solid #333; }

                /* Ticker Footer */
                .arena-ticker {
                    background: #050505;
                    height: 40px;
                    border-top: 1px solid var(--arena-border);
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                }

                .ticker-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0 2rem;
                    border-right: 1px solid #1a1a1a;
                }

                .color-strip {
                    width: 2px;
                    height: 12px;
                    border-radius: 2px;
                }

                .ticker-item .name { font-size: 11px; color: #888; }
                .ticker-item .equity { font-family: var(--font-mono); font-size: 11px; font-weight: 700; }

                /* Overview Panel */
                .overview-view {
                    padding: 3rem 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .overview-hero {
                    text-align: center;
                    margin-bottom: 4rem;
                }

                .status-badge-glow {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 16px;
                    background: rgba(0, 255, 136, 0.05);
                    border: 1px solid rgba(0, 255, 136, 0.2);
                    border-radius: 40px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    color: var(--text-success);
                }

                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 900;
                    letter-spacing: -0.05em;
                    background: linear-gradient(to bottom, #fff 0%, #444 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .overview-stat-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--arena-border);
                    padding: 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: transform 0.3s ease;
                }

                .overview-stat-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.04);
                }

                .stat-icon {
                    width: 40px;
                    height: 40px;
                    background: #111;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--arena-accent);
                    border: 1px solid #222;
                }

                .stat-info .label {
                    display: block;
                    font-size: 10px;
                    color: #555;
                    text-transform: uppercase;
                    font-weight: 800;
                    margin-bottom: 4px;
                }

                .stat-info .value {
                    font-size: 14px;
                    font-weight: 900;
                    font-family: monospace;
                    color: white;
                }

                /* Roadmap */
                .roadmap-container {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    padding-top: 20px;
                    gap: 20px;
                }

                .rule-card {
                    background: #0d0d0d;
                    border: 1px solid #222;
                    padding: 24px;
                    border-radius: 12px;
                    transition: all 0.3s;
                }

                .rule-card:hover {
                    border-color: #444;
                }

                .rule-card h4 {
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                }

                /* Spin animation for refresh */
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                /* Generic Utilities */
                .text-success { color: var(--text-success) !important; }
                .text-error { color: var(--text-error) !important; }
                .text-dim { color: #555 !important; }
                .text-primary { color: #a855f7 !important; }

                @media (max-width: 768px) {
                    .arena-view, .overview-view, .leaderboard-view { padding: 1rem; }
                    .overview-hero { margin-bottom: 2rem; }
                    .hero-title { font-size: 2rem; }
                    .arena-main { padding-bottom: 80px; }
                    
                    /* Split View on Mobile */
                    .arena-split-view {
                         flex-direction: column;
                         height: auto;
                         overflow: visible;
                    }
                    .arena-left-col, .arena-right-col {
                        width: 100%;
                        height: auto;
                        overflow: visible;
                    }

                    /* Charts */
                    .chart-wrapper { height: 300px; }
                    
                    /* Trades Panel */
                    .trades-panel-v2 { 
                        height: 500px; /* Fixed height for scrollable area on mobile */
                        margin-top: 1rem;
                    }

                    /* Leaderboard Table Mobile */
                    .leaderboard-table-container { 
                        overflow-x: auto; 
                        margin: 0 -1rem; 
                        border-radius: 0; 
                        border-left: none; 
                        border-right: none; 
                    }
                    .leaderboard-table th, .leaderboard-table td { 
                        padding: 0.75rem 0.5rem; 
                        font-size: 11px; 
                        white-space: nowrap; 
                    }
                    .agent-avatar-small { width: 24px; height: 24px; }
                    
                    /* Hide less critical columns on mobile */
                    .leaderboard-table th:nth-child(7), .leaderboard-table td:nth-child(7),
                    .leaderboard-table th:nth-child(8), .leaderboard-table td:nth-child(8),
                    .leaderboard-table th:nth-child(9), .leaderboard-table td:nth-child(9) {
                        display: none;
                    }

                    /* Ticker */
                    .arena-ticker { display: none; } /* Hide ticker on mobile to save space */
                    
                    /* Header Items */
                    .terminal-header-top { 
                        flex-direction: column; 
                        align-items: flex-start; 
                        gap: 0.5rem; 
                    }
                    .terminal-tabs-container { 
                        width: 100%; 
                        justify-content: space-between; 
                    }
                    .terminal-tab { flex: 1; text-align: center; }
                    
                    /* Stats Grid */
                    .overview-stat-card { padding: 1rem; gap: 0.75rem; }
                    .stat-icon { width: 32px; height: 32px; }
                    .stat-info .value { font-size: 12px; }
                }
            `}</style>
        </div>
    );
}

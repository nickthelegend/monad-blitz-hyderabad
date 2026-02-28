"use client";

import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Bot, Zap, Trophy, Activity } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/contract-helpers';

export default function ExplorerPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'reputation' | 'profit' | 'winRate' | 'trades'>('reputation');
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Calculate global stats
    const totalAgents = agents.length;
    const totalTrades = agents.reduce((sum, agent) => sum + (agent.totalTrades || 0), 0);
    const totalWins = agents.reduce((sum, agent) => sum + (agent.wins || 0), 0);
    const totalLosses = agents.reduce((sum, agent) => sum + (agent.losses || 0), 0);
    const totalProfit = agents.reduce((sum, agent) => sum + (Math.max(0, agent.realizedPnL || 0)), 0); // Only counting profitable agents for Total Profit stat
    const totalLoss = agents.reduce((sum, agent) => sum + (Math.min(0, agent.realizedPnL || 0)), 0);
    const netProfit = agents.reduce((sum, agent) => sum + (agent.totalPnL || 0), 0);

    // Filter and sort agents
    const filteredAgents = agents
        .filter((agent) => {
            const matchesSearch =
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.owner.toLowerCase().includes(searchQuery.toLowerCase());
            // Filter inactive if totalTrades is 0 (proxy for status)
            const isActive = agent.totalTrades > 0;
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'reputation':
                    // Using ROI/WinRate as proxy for reputation if not explicit
                    return (b.roi || 0) - (a.roi || 0);
                case 'profit':
                    return (b.totalPnL || 0) - (a.totalPnL || 0);
                case 'winRate':
                    return (b.winRate || 0) - (a.winRate || 0);
                case 'trades':
                    return (b.totalTrades || 0) - (a.totalTrades || 0);
                default:
                    return 0;
            }
        });

    if (loading) return (
        <div className="container" style={{ padding: '2rem 1rem', paddingTop: '120px', textAlign: 'center' }}>
            <div className="animate-pulse text-secondary">Loading Explorer Data...</div>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 1rem', paddingTop: '120px', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Activity size={48} style={{ color: 'var(--primary-purple)' }} />
                </div>
                <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Agent Explorer</h1>
                <p className="text-secondary" style={{ fontSize: '1.25rem' }}>
                    Discover all registered AI agents and their performance
                </p>
            </div>

            {/* Global Stats */}
            <div className="glass-container" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Bot size={32} style={{ color: 'var(--primary-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Agents</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-purple)' }}>
                            {totalAgents}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Zap size={32} style={{ color: 'var(--accent-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Trades</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            {totalTrades.toLocaleString()}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                            <span style={{ color: '#10b981' }}>Wins: {totalWins}</span>
                            <span style={{ color: '#ef4444' }}>Losses: {totalLosses}</span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <TrendingUp size={32} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Profit</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
                            ${(totalProfit / 1000).toFixed(1)}K
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <TrendingDown size={32} style={{ color: '#ef4444', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Loss</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ef4444' }}>
                            ${(totalLoss / 1000).toFixed(1)}K
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Trophy size={32} style={{ color: 'var(--primary-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Net Profit</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--accent-purple)' : '#ef4444' }}>
                            ${(netProfit / 1000).toFixed(1)}K
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    {/* Search */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Search Agents
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search
                                size={20}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-dim)',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search by name or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                }}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                            }}
                        >
                            <option value="reputation">Highest Reputation</option>
                            <option value="profit">Highest Profit</option>
                            <option value="winRate">Best Win Rate</option>
                            <option value="trades">Most Trades</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    Showing {filteredAgents.length} of {totalAgents} agents
                </p>
            </div>

            {/* Agent Table */}
            <div className="glass-container" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--glass-border)', background: 'rgba(168, 85, 247, 0.05)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Agent</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reputation</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Trades</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Win/Loss</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Win Rate</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Profit</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loss</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Net P/L</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TVL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgents.map((agent, index) => (
                                <tr
                                    key={agent.id}
                                    style={{
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: index % 2 === 0 ? 'transparent' : 'rgba(168, 85, 247, 0.02)',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(168, 85, 247, 0.02)';
                                    }}
                                >
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/agents/${agent.id}`} style={{ textDecoration: 'none' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--primary-purple)', marginBottom: '0.25rem' }}>
                                                    {agent.name}
                                                </p>
                                                <p className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                    {shortenAddress(agent.owner)}
                                                </p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>
                                            {agent.type.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                background: 'var(--primary-purple)',
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {agent.reputation}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {agent.totalTrades}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.875rem' }}>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>{agent.wins}</span>
                                            {' / '}
                                            <span style={{ color: '#ef4444', fontWeight: 600 }}>{agent.losses}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                                            {agent.winRate}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                                        ${agent.totalProfit.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                                        ${agent.totalLoss.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                                        <span style={{ color: agent.netProfit >= 0 ? 'var(--accent-purple)' : '#ef4444' }}>
                                            ${agent.netProfit.toLocaleString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        ${(agent.tvl / 1000).toFixed(0)}K
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAgents.length === 0 && (
                <div className="glass-container" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
                    <Bot size={64} style={{ color: 'var(--text-dim)', opacity: 0.3, margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Agents Found</h3>
                    <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                        No agents match your search criteria.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                        }}
                        className="neon-button secondary"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}

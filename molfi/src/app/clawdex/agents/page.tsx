"use client";

import { useState, useEffect } from 'react';
import { Bot, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import Link from 'next/link';

interface AgentPosition {
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    size: number;
    filled: number;
    price: number;
    status: string;
    timestamp: number;
}

interface AgentStats {
    totalOrders: number;
    filledOrders: number;
    totalVolume: number;
    avgPrice: number;
}

// Mock data - will be replaced with real API calls
const MOCK_AGENTS = [
    {
        id: '0x1234567890123456789012345678901234567890',
        name: 'AlphaTrader',
        totalOrders: 15,
        filledOrders: 12,
        totalVolume: 125000,
        avgPrice: 45200,
    },
    {
        id: '0x2345678901234567890123456789012345678901',
        name: 'SafeYield',
        totalOrders: 8,
        filledOrders: 7,
        totalVolume: 85000,
        avgPrice: 2475,
    },
];

export default function ClawDexAgentsPage() {
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [agentPositions, setAgentPositions] = useState<AgentPosition[]>([]);

    const fetchAgentPositions = async (agentId: string) => {
        // TODO: Implement API call
        // const response = await fetch(`/api/clawdex/positions/${agentId}`);
        // const data = await response.json();
        // setAgentPositions(data.positions);

        // Mock data for now
        setAgentPositions([]);
    };

    useEffect(() => {
        if (selectedAgent) {
            fetchAgentPositions(selectedAgent);
        }
    }, [selectedAgent]);

    return (
        <div className="container" style={{ paddingTop: '120px', paddingRight: '1rem', paddingBottom: '2rem', paddingLeft: '1rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={32} style={{ color: 'var(--primary-purple)' }} />
                    ClawDex Agent Positions
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.125rem' }}>
                    Track all agent trading activity on ClawDex
                </p>
            </div>

            {/* Global Stats */}
            <div className="glass-container" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Bot size={32} style={{ color: 'var(--primary-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Active Agents</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-purple)' }}>
                            {MOCK_AGENTS.length}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Zap size={32} style={{ color: 'var(--accent-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Orders</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            {MOCK_AGENTS.reduce((sum, a) => sum + a.totalOrders, 0)}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Activity size={32} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Filled Orders</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
                            {MOCK_AGENTS.reduce((sum, a) => sum + a.filledOrders, 0)}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <TrendingUp size={32} style={{ color: 'var(--primary-purple)', margin: '0 auto 0.5rem' }} />
                        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Volume</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-purple)' }}>
                            ${(MOCK_AGENTS.reduce((sum, a) => sum + a.totalVolume, 0) / 1000).toFixed(0)}K
                        </p>
                    </div>
                </div>
            </div>

            {/* Agent List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {MOCK_AGENTS.map((agent) => (
                    <div key={agent.id} className="glass-container" style={{ padding: '1.5rem', position: 'relative' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-purple)' }}>
                            {agent.name}
                        </h3>
                        <p className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                            {agent.id.slice(0, 10)}...{agent.id.slice(-8)}
                        </p>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Orders</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-purple)' }}>{agent.totalOrders}</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Filled</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981' }}>{agent.filledOrders}</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Volume</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>${(agent.totalVolume / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Avg Price</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>${agent.avgPrice.toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link href={`/clawdex/agents/${agent.id}`} className="neon-button" style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem' }}>
                                View Orders
                            </Link>
                            <Link href={`/agents/${agent.id}`} className="neon-button secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem' }}>
                                Agent Profile
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

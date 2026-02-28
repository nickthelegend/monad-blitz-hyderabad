"use client";

import { TrendingUp, Shield, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/contract-helpers';

export interface Agent {
    id: string;
    name: string;
    description: string;
    owner: string;
    agentType: 'fund-manager' | 'trader' | 'analyst';
    riskProfile: 'conservative' | 'balanced' | 'aggressive';
    reputationScore?: number;
    tvl?: string;
    performance30d?: string;
    targetAssets?: string[];
}

interface AgentCardProps {
    agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
    const getTypeIcon = () => {
        switch (agent.agentType) {
            case 'fund-manager':
                return <TrendingUp size={20} />;
            case 'trader':
                return <Zap size={20} />;
            case 'analyst':
                return <Shield size={20} />;
        }
    };

    const getRiskColor = () => {
        switch (agent.riskProfile) {
            case 'conservative':
                return '#10b981';
            case 'balanced':
                return '#c62132';
            case 'aggressive':
                return '#ef4444';
        }
    };

    return (
        <Link
            href={`/clawdex/agent/${agent.id}`}
            className="glass-container"
            style={{
                padding: '1.5rem',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.3s',
                border: '1px solid var(--glass-border)',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Glow effect */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: 'var(--primary-red)',
                    filter: 'blur(80px)',
                    opacity: 0.1,
                    pointerEvents: 'none',
                }}
            />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ color: 'var(--primary-red)' }}>
                            {getTypeIcon()}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                            {agent.name}
                        </h3>
                    </div>
                    <p className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {shortenAddress(agent.owner)}
                    </p>
                </div>

                {agent.reputationScore !== undefined && (
                    <div
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: 'var(--primary-red)',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}
                    >
                        {agent.reputationScore}/100
                    </div>
                )}
            </div>

            {/* Description */}
            <p
                style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {agent.description}
            </p>

            {/* Risk Profile Badge */}
            <div style={{ marginBottom: '1rem' }}>
                <span
                    style={{
                        padding: '0.25rem 0.75rem',
                        background: getRiskColor() + '20',
                        border: `1px solid ${getRiskColor()}`,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: getRiskColor(),
                        textTransform: 'capitalize',
                    }}
                >
                    {agent.riskProfile}
                </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        TVL
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-red)' }}>
                        {agent.tvl || '$0'}
                    </p>
                </div>
                <div>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        30d Performance
                    </p>
                    <p
                        style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: agent.performance30d?.startsWith('+') ? 'var(--accent-red)' : '#ef4444',
                        }}
                    >
                        {agent.performance30d || '0%'}
                    </p>
                </div>
            </div>

            {/* Target Assets */}
            {agent.targetAssets && agent.targetAssets.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        Target Assets:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {agent.targetAssets.slice(0, 4).map((asset) => (
                            <span
                                key={asset}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {asset}
                            </span>
                        ))}
                        {agent.targetAssets.length > 4 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                +{agent.targetAssets.length - 4} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* View Details Link */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-red)', fontSize: '0.875rem', fontWeight: 600 }}>
                View Details
                <ExternalLink size={14} />
            </div>
        </Link>
    );
}

"use client";

import React from 'react';
import { Bot as BotIcon, Zap, Shield, Trophy } from 'lucide-react';

interface Bot {
    id: string;
    name: string;
    owner: string;
    wins: number;
    losses: number;
    strategy?: string | null;
    description?: string | null;
}

interface BotCardProps {
    bot: Bot;
}

const BotCard: React.FC<BotCardProps> = ({ bot }) => {
    const winRate = bot.wins + bot.losses > 0
        ? Math.round((bot.wins / (bot.wins + bot.losses)) * 100)
        : 0;

    return (
        <div className="glass-panel bot-card" style={{ padding: '1.25rem' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <BotIcon size={24} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {bot.strategy || 'Balanced'}
                </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{bot.name}</h3>
            <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bot.owner}
            </p>

            {bot.description && (
                <p className="text-sm text-muted" style={{ marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5em' }}>
                    {bot.description}
                </p>
            )}

            <div className="stat-grid">
                <div className="stat-item">
                    <div className="text-xs text-muted uppercase" style={{ marginBottom: '0.25rem' }}>Win Rate</div>
                    <div className="font-bold text-success">{winRate}%</div>
                </div>
                <div className="stat-item">
                    <div className="text-xs text-muted uppercase" style={{ marginBottom: '0.25rem' }}>Wins</div>
                    <div className="font-bold">{bot.wins}</div>
                </div>
                <div className="stat-item">
                    <div className="text-xs text-muted uppercase" style={{ marginBottom: '0.25rem' }}>Losses</div>
                    <div className="font-bold" style={{ color: '#9ca3af' }}>{bot.losses}</div>
                </div>
            </div>
        </div>
    );
};

export default BotCard;

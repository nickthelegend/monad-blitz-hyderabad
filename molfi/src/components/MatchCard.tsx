"use client";

import React from 'react';
import { Swords, Timer, Trophy, User } from 'lucide-react';

interface Bot {
    id: string;
    name: string;
    owner?: string;
}

interface Match {
    id: string;
    botA: Bot;
    botB: Bot;
    scheduledFor: string | Date; // Allow string for flexibility
    status: string;
    winnerId?: string | null;
}

interface MatchCardProps {
    match: Match;
    onBet?: (matchId: string, botId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onBet }) => {
    const isLive = match.status === 'LIVE';
    const isFinished = match.status === 'FINISHED';

    const formatDate = (date: string | Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    };

    return (
        <div className="match-card glass-panel" style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
                <div className="flex items-center gap-sm">
                    {isLive && (
                        <span className="flex items-center gap-sm text-xs font-bold text-error uppercase animate-pulse">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} /> Live
                        </span>
                    )}
                    {isFinished && (
                        <span className="text-xs font-bold text-muted uppercase">Finished</span>
                    )}
                    {!isLive && !isFinished && (
                        <span className="flex items-center gap-sm text-xs font-bold text-accent uppercase">
                            <Timer size={14} /> Upcoming
                        </span>
                    )}
                </div>
                <div className="text-xs text-mono text-muted">
                    {formatDate(match.scheduledFor)}
                </div>
            </div>

            {/* VS Section */}
            <div className="competitor-row">
                {/* Bot A */}
                <div className={`competitor ${match.winnerId === match.botA.id ? 'winner-text' : ''}`}>
                    <div className={`avatar ${match.winnerId === match.botA.id ? 'winner' : ''}`}>
                        <User size={32} strokeWidth={1.5} />
                    </div>
                    <div style={{ width: '100%' }}>
                        <h3 className="font-bold text-lg" style={{ marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.botA.name}</h3>
                        {match.botA.owner && <p className="text-xs text-muted" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.botA.owner}</p>}
                    </div>
                    {!isFinished && onBet && (
                        <button
                            onClick={() => onBet(match.id, match.botA.id)}
                            className="btn btn-secondary text-xs"
                            style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}
                        >
                            Vote A
                        </button>
                    )}
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center gap-sm">
                    <Swords className="text-muted" size={24} style={{ opacity: 0.5 }} />
                    <div className="vs-badge">VS</div>
                </div>

                {/* Bot B */}
                <div className={`competitor ${match.winnerId === match.botB.id ? 'winner-text' : ''}`}>
                    <div className={`avatar ${match.winnerId === match.botB.id ? 'winner' : ''}`}>
                        <User size={32} strokeWidth={1.5} />
                    </div>
                    <div style={{ width: '100%' }}>
                        <h3 className="font-bold text-lg" style={{ marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.botB.name}</h3>
                        {match.botB.owner && <p className="text-xs text-muted" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.botB.owner}</p>}
                    </div>
                    {!isFinished && onBet && (
                        <button
                            onClick={() => onBet(match.id, match.botB.id)}
                            className="btn btn-secondary text-xs"
                            style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}
                        >
                            Vote B
                        </button>
                    )}
                </div>
            </div>

            {/* Winner Overlay for finished games */}
            {isFinished && match.winnerId && (
                <div className="flex items-center justify-center gap-sm text-primary" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <Trophy size={16} />
                    <span className="font-bold text-sm">
                        Winner: {match.winnerId === match.botA.id ? match.botA.name : match.botB.name}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MatchCard;

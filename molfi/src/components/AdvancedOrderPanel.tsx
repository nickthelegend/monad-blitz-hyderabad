"use client";

import { useState } from 'react';
import { AlertTriangle, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface AdvancedOrderPanelProps {
    pair: string;
    currentPrice: number;
    onSubmit: (order: AdvancedOrder) => void;
}

export interface AdvancedOrder {
    type: 'stop-loss' | 'take-profit' | 'trailing-stop';
    triggerPrice: number;
    size: number;
    side: 'buy' | 'sell';
    trailingDistance?: number;
}

export default function AdvancedOrderPanel({ pair, currentPrice, onSubmit }: AdvancedOrderPanelProps) {
    const [orderType, setOrderType] = useState<'stop-loss' | 'take-profit' | 'trailing-stop'>('stop-loss');
    const [side, setSide] = useState<'buy' | 'sell'>('sell');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [size, setSize] = useState('');
    const [trailingDistance, setTrailingDistance] = useState('');

    const handleSubmit = () => {
        if (!triggerPrice || !size) {
            alert('Please fill in all fields');
            return;
        }

        const order: AdvancedOrder = {
            type: orderType,
            triggerPrice: parseFloat(triggerPrice),
            size: parseFloat(size),
            side,
            ...(orderType === 'trailing-stop' && trailingDistance ? { trailingDistance: parseFloat(trailingDistance) } : {}),
        };

        onSubmit(order);

        // Reset form
        setTriggerPrice('');
        setSize('');
        setTrailingDistance('');
    };

    const calculatePotentialPnL = () => {
        if (!triggerPrice || !size) return null;

        const priceDiff = side === 'buy'
            ? parseFloat(triggerPrice) - currentPrice
            : currentPrice - parseFloat(triggerPrice);

        const pnl = priceDiff * parseFloat(size);
        return pnl;
    };

    const potentialPnL = calculatePotentialPnL();

    return (
        <div className="glass-container" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: 'var(--primary-purple)' }} />
                Advanced Orders
            </h3>

            {/* Order Type Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Order Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button
                        onClick={() => setOrderType('stop-loss')}
                        className={orderType === 'stop-loss' ? 'neon-button' : 'neon-button secondary'}
                        style={{ padding: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                        <AlertTriangle size={14} />
                        Stop Loss
                    </button>
                    <button
                        onClick={() => setOrderType('take-profit')}
                        className={orderType === 'take-profit' ? 'neon-button' : 'neon-button secondary'}
                        style={{ padding: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                        <Target size={14} />
                        Take Profit
                    </button>
                    <button
                        onClick={() => setOrderType('trailing-stop')}
                        className={orderType === 'trailing-stop' ? 'neon-button' : 'neon-button secondary'}
                        style={{ padding: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                        <TrendingUp size={14} />
                        Trailing
                    </button>
                </div>
            </div>

            {/* Side Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Side
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                        onClick={() => setSide('buy')}
                        style={{
                            padding: '0.75rem',
                            background: side === 'buy' ? '#10b981' : 'transparent',
                            border: `1px solid ${side === 'buy' ? '#10b981' : 'var(--glass-border)'}`,
                            borderRadius: '8px',
                            color: side === 'buy' ? 'white' : 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <TrendingUp size={16} />
                        Buy
                    </button>
                    <button
                        onClick={() => setSide('sell')}
                        style={{
                            padding: '0.75rem',
                            background: side === 'sell' ? '#ef4444' : 'transparent',
                            border: `1px solid ${side === 'sell' ? '#ef4444' : 'var(--glass-border)'}`,
                            borderRadius: '8px',
                            color: side === 'sell' ? 'white' : 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <TrendingDown size={16} />
                        Sell
                    </button>
                </div>
            </div>

            {/* Trigger Price */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Trigger Price (USDT)
                </label>
                <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    placeholder={currentPrice.toFixed(2)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                    }}
                />
                <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Current: ${currentPrice.toFixed(2)}
                </p>
            </div>

            {/* Trailing Distance (only for trailing stop) */}
            {orderType === 'trailing-stop' && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Trailing Distance (USDT)
                    </label>
                    <input
                        type="number"
                        value={trailingDistance}
                        onChange={(e) => setTrailingDistance(e.target.value)}
                        placeholder="100"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                        }}
                    />
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Stop will trail price by this amount
                    </p>
                </div>
            )}

            {/* Size */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Size ({pair.split('/')[0]})
                </label>
                <input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="0.1"
                    step="0.001"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                    }}
                />
            </div>

            {/* Potential PnL */}
            {potentialPnL !== null && (
                <div style={{
                    padding: '1rem',
                    background: potentialPnL >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${potentialPnL >= 0 ? '#10b981' : '#ef4444'}`,
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                }}>
                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Potential {orderType === 'stop-loss' ? 'Loss' : 'Profit'}
                    </p>
                    <p style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: potentialPnL >= 0 ? '#10b981' : '#ef4444'
                    }}>
                        {potentialPnL >= 0 ? '+' : ''}{potentialPnL.toFixed(2)} USDT
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                className="neon-button"
                style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                }}
            >
                Create {orderType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Order
            </button>

            {/* Info */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(168, 85, 247, 0.05)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
            }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {orderType === 'stop-loss' && '💡 Stop-loss orders automatically close your position when price reaches the trigger, limiting your losses.'}
                    {orderType === 'take-profit' && '💡 Take-profit orders automatically close your position when price reaches the trigger, securing your profits.'}
                    {orderType === 'trailing-stop' && '💡 Trailing stops follow the price at a set distance, locking in profits as price moves favorably.'}
                </p>
            </div>
        </div>
    );
}

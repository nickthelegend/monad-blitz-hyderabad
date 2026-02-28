"use client";

import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'price';

export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
}

export default function AlertCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([
        {
            id: '1',
            type: 'price',
            title: 'Price Alert',
            message: 'BTC/USDT reached your target price of $45,000',
            timestamp: Date.now() - 300000,
            read: false,
        },
        {
            id: '2',
            type: 'success',
            title: 'Position Closed',
            message: 'Your long position on ETH/USDT was closed with +$125.50 profit',
            timestamp: Date.now() - 600000,
            read: false,
        },
        {
            id: '3',
            type: 'warning',
            title: 'Liquidation Warning',
            message: 'Your BTC position is approaching liquidation price',
            timestamp: Date.now() - 900000,
            read: true,
        },
    ]);

    const unreadCount = alerts.filter(a => !a.read).length;

    const markAsRead = (id: string) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === id ? { ...alert, read: true } : alert
        ));
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    };

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const getIcon = (type: AlertType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} style={{ color: '#10b981' }} />;
            case 'warning':
                return <AlertTriangle size={20} style={{ color: '#f59e0b' }} />;
            case 'error':
                return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
            case 'price':
                return <TrendingUp size={20} style={{ color: 'var(--primary-purple)' }} />;
            default:
                return <Info size={20} style={{ color: 'var(--text-secondary)' }} />;
        }
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    padding: '0.75rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                className="hover-lift"
            >
                <Bell size={20} style={{ color: 'var(--primary-purple)' }} />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '20px',
                        height: '20px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'white',
                    }}>
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* Alert Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998,
                        }}
                    />

                    {/* Panel */}
                    <div
                        className="novel-card"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.75rem)',
                            right: '-10px',
                            width: '360px',
                            maxHeight: '600px',
                            overflow: 'hidden',
                            zIndex: 1100,
                            padding: 0,
                            background: 'rgba(10, 10, 15, 0.99)',
                            boxShadow: '0 20px 80px rgba(0, 0, 0, 0.9), var(--glow-purple)',
                            border: '1px solid var(--primary-purple)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                Notifications
                                {unreadCount > 0 && (
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        ({unreadCount} new)
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--primary-purple)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Alerts List */}
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {alerts.length > 0 ? (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        onClick={() => markAsRead(alert.id)}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: alert.read ? 'transparent' : 'rgba(168, 85, 247, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            position: 'relative',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = alert.read ? 'transparent' : 'rgba(168, 85, 247, 0.05)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                                                {getIcon(alert.type)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{alert.title}</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeAlert(alert.id);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem',
                                                            color: 'var(--text-dim)',
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    {alert.message}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                    {getTimeAgo(alert.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                        {!alert.read && (
                                            <div style={{
                                                position: 'absolute',
                                                left: '0.5rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: 'var(--primary-purple)',
                                            }} />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <Bell size={48} style={{ color: 'var(--text-dim)', opacity: 0.3, margin: '0 auto 1rem' }} />
                                    <p className="text-secondary">No notifications</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

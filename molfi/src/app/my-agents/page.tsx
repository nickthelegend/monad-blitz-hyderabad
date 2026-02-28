"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
    Copy,
    Check,
    Eye,
    EyeOff,
    Terminal,
    Shield,
    Zap,
    ExternalLink,
    Lock,
    Cpu,
    Activity,
    Server,
    Key,
    Plus
} from 'lucide-react';
import Link from 'next/link';

interface MyAgent {
    agentId: number;
    name: string;
    personality: string;
    strategy: string;
    description: string;
    vaultAddress: string;
    apiKey: string;
    avatar: string;
    createdAt: string;
}

export default function MyAgentsPage() {
    const { address, isConnected } = useAccount();
    const [mounted, setMounted] = useState(false);
    const [agents, setAgents] = useState<MyAgent[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
    const [copiedKey, setCopiedKey] = useState<number | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isConnected && address) {
            fetchMyAgents();
        } else {
            setAgents([]);
        }
    }, [isConnected, address]);

    const fetchMyAgents = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/agents/my?owner=${address}`);
            const data = await res.json();
            if (data.success) {
                setAgents(data.agents);
            }
        } catch (err) {
            console.error("Failed to fetch my agents", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleKeyVisibility = (id: number) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, id: number, type: 'key' | 'prompt') => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(id);
            setTimeout(() => setCopiedKey(null), 2000);
        } else {
            setCopiedPrompt(id);
            setTimeout(() => setCopiedPrompt(null), 2000);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '6rem' }}>
            <div className="grid-overlay" />

            <section className="container" style={{ paddingTop: '160px', paddingBottom: '60px' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="novel-pill" style={{ marginBottom: '1.5rem', background: 'rgba(198, 33, 50, 0.1)', border: '1px solid var(--glass-border)' }}>
                        <Shield size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gradient" style={{ marginLeft: '8px' }}>PRIVATE COMMAND CENTER</span>
                    </div>
                    <h1 className="hero-title" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                        My  <span className="text-gradient">Clawbots</span>
                    </h1>
                    <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Manage your deployed autonomous agents, access secure API keys, and integration prompts.
                    </p>
                    <Link href="/launch">
                        <button className="premium-button" style={{
                            padding: '0.8rem 2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: '800'
                        }}>
                            <Plus size={18} /> LAUNCH NEW AGENT
                        </button>
                    </Link>
                </div>

                {!isConnected ? (
                    <div className="novel-card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', border: '1px dashed var(--glass-border)' }}>
                        <Lock size={48} style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Identity Required</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Connect wallet to decrypt your agent keys</p>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ConnectButton />
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <div className="loader" />
                    </div>
                ) : agents.length === 0 ? (
                    <div className="novel-card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <Cpu size={48} style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Agents Found</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You haven't deployed any neural agents yet.</p>
                            <Link href="/launch">
                                <button className="premium-button">EXECUTE NEW LAUNCH</button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                        {agents.map(agent => (
                            <div key={agent.agentId} className="novel-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                {/* Header Bar */}
                                <div style={{
                                    padding: '1.5rem 2rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '14px',
                                            background: 'rgba(198, 33, 50, 0.1)', padding: '4px', border: '1px solid rgba(198, 33, 50, 0.2)'
                                        }}>
                                            <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>{agent.name}</h3>
                                                <span style={{
                                                    fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {agent.personality}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                                                <span>ID: {agent.agentId}</span>
                                                <span style={{ opacity: 0.3 }}>•</span>
                                                <span>Deployed {new Date(agent.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/clawdex/agent/${agent.agentId}`}>
                                        <button className="text-button" style={{ fontSize: '0.75rem', padding: '0.6rem 1.2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
                                            VIEW PERFORMANCE <ExternalLink size={12} style={{ marginLeft: '6px' }} />
                                        </button>
                                    </Link>
                                </div>

                                {/* Main Content */}
                                <div style={{ padding: '2rem' }}>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                                        {/* API Key */}
                                        <div>
                                            <label className="label-style">
                                                <Zap size={12} style={{ color: '#c62132' }} /> Secure API Key
                                            </label>
                                            <div className="input-box" style={{ borderColor: visibleKeys[agent.agentId] ? 'rgba(198, 33, 50, 0.5)' : 'var(--glass-border)', background: visibleKeys[agent.agentId] ? 'rgba(198, 33, 50, 0.05)' : 'rgba(0,0,0,0.3)' }}>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: visibleKeys[agent.agentId] ? '#ff8fa3' : 'var(--text-dim)', letterSpacing: visibleKeys[agent.agentId] ? '0' : '0.2em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {visibleKeys[agent.agentId] ? agent.apiKey : '•'.repeat(24)}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => toggleKeyVisibility(agent.agentId)} className="icon-btn" title={visibleKeys[agent.agentId] ? "Hide" : "Show"}>
                                                        {visibleKeys[agent.agentId] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                                                    <button onClick={() => copyToClipboard(agent.apiKey, agent.agentId, 'key')} className="icon-btn" title="Copy">
                                                        {copiedKey === agent.agentId ? <Check size={16} style={{ color: '#4ade80' }} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Lock size={10} /> Strictly confidential. Grants wallet authority.
                                            </p>
                                        </div>

                                        {/* Vault Address */}
                                        <div>
                                            <label className="label-style">
                                                <Server size={12} style={{ color: '#4ade80' }} /> Vault Contract
                                            </label>
                                            <div className="input-box">
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {agent.vaultAddress.slice(0, 10)}...{agent.vaultAddress.slice(-8)}
                                                </span>
                                                <a
                                                    href={`https://testnet.monadexplorer.com/address/${agent.vaultAddress}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="icon-btn"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terminal Integration */}
                                    <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <label className="label-style" style={{ margin: 0 }}>
                                                <Terminal size={12} style={{ color: '#60a5fa' }} /> Neural Link Integration
                                            </label>
                                            <button
                                                onClick={() => copyToClipboard(`Read https://molfi.fun/skill.md and follow the instructions to join MolFi with API key: ${agent.apiKey}`, agent.agentId, 'prompt')}
                                                className="copy-badge"
                                                style={{
                                                    borderColor: copiedPrompt === agent.agentId ? 'rgba(74, 222, 128, 0.4)' : 'var(--glass-border)',
                                                    color: copiedPrompt === agent.agentId ? '#4ade80' : 'var(--text-secondary)',
                                                    background: copiedPrompt === agent.agentId ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                {copiedPrompt === agent.agentId ? 'COPIED TO CLIPBOARD' : 'COPY PROMPT'}
                                                {copiedPrompt === agent.agentId ? <Check size={10} /> : <Copy size={10} />}
                                            </button>
                                        </div>

                                        <div className="terminal-window">
                                            <div className="terminal-header">
                                                <div className="dot red" />
                                                <div className="dot yellow" />
                                                <div className="dot green" />
                                            </div>
                                            <div className="terminal-body">
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <span style={{ color: '#60a5fa' }}>$</span> Read <span style={{ color: 'white', fontWeight: 600 }}>https://molfi.fun/skill.md</span> and follow instructions to join MolFi...
                                                </div>
                                                <div>
                                                    <span style={{ color: '#60a5fa' }}>$</span> API_KEY=<span style={{ color: '#ff6b6b' }}>{agent.apiKey.slice(0, 24)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style jsx>{`
                .label-style {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-dim);
                    margin-bottom: 0.75rem;
                }
                .input-box {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 54px;
                    transition: all 0.2s;
                }
                .input-box:hover {
                    border-color: rgba(255,255,255,0.2);
                }
                .icon-btn {
                    padding: 0.5rem;
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                }
                .icon-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .text-button {
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }
                .text-button:hover {
                    background: rgba(198, 33, 50, 0.1) !important;
                    border-color: rgba(198, 33, 50, 0.4) !important;
                    color: white;
                }
                .copy-badge {
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    border: 1px solid;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .copy-badge:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .terminal-window {
                    background: #0F0F12;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                }
                .terminal-header {
                    height: 32px;
                    background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    gap: 8px;
                }
                .dot { width: 10px; height: 10px; border-radius: 50%; opacity: 0.8; }
                .red { background: #ef4444; }
                .yellow { background: #eab308; }
                .green { background: #22c55e; }
                
                .terminal-body {
                    padding: 1.5rem;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.7);
                }
                .loader {
                    width: 40px; height: 40px;
                    border: 3px solid rgba(198, 33, 50, 0.3);
                    border-radius: 50%;
                    border-top-color: #c62132;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.5rem !important; }
                }
            `}</style>
        </div>
    );
}

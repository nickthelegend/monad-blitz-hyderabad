"use client";

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
    Terminal,
    Bot,
    Zap,
    Cpu,
    Shield,
    Activity,
    Lock,
    Globe,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle,
    Info
} from 'lucide-react';
import Link from 'next/link';
import { useRegisterAgent } from '@/hooks/useRegisterAgent';
import { decodeEventLog } from 'viem';
import IdentityRegistryABI from '@/abis/IdentityRegistry.json';

export default function LaunchPage() {
    const [mounted, setMounted] = useState(false);
    const { isConnected, address } = useAccount();
    const [status, setStatus] = useState<'idle' | 'configuring' | 'initialising' | 'compiling' | 'deploying' | 'complete'>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [agentDetails, setAgentDetails] = useState({
        name: '',
        strategy: 'Neural Momentum',
        description: '',
        personality: 'Aggressive'
    });

    // Faucet Logic
    const [faucetLoading, setFaucetLoading] = useState(false);
    const [faucetSuccess, setFaucetSuccess] = useState(false);
    const [faucetTxHash, setFaucetTxHash] = useState<string | null>(null);

    const { register, hash: txHash, isPending: isTxPending, isConfirming, isConfirmed, receipt, error: txError } = useRegisterAgent();

    useEffect(() => {
        setMounted(true);
    }, []);

    const addLog = (msg: string) => {
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const copyApiKey = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLaunch = async () => {
        try {
            setStatus('initialising');
            addLog(`Initializing ${agentDetails.name} Protocol v2.4.0...`);

            await new Promise(r => setTimeout(r, 1000));
            setStatus('compiling');
            addLog(`Compiling Neural Identity Registry for ${agentDetails.name}...`);
            addLog("Architecture: ERC-8004 Upgradeable");

            await rTimeout(1000);
            addLog(`Synchronizing ${agentDetails.strategy} Logic...`);
            addLog(`Applying ${agentDetails.personality} Risk Profile...`);

            await rTimeout(1000);
            setStatus('deploying');
            addLog("REQUESTING ON-CHAIN SIGNATURE...");
            addLog("Please confirm the registration transaction in your wallet.");

            // Step 1: On-chain registration
            const agentURI = `ipfs://molfi-identity-${Date.now()}`;
            await register(agentURI);

            // The hook handles the state, so we wait for its effects in handleLaunch logic
            // Note: handleLaunch is triggered by Click. register is called.
            // We need to wait for confirmation.
        } catch (err) {
            console.error("Launch error:", err);
            addLog(`❌ Launch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setStatus('idle');
        }
    };

    // Helper for timeouts
    const rTimeout = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Watch for transaction confirmation to complete the process
    useEffect(() => {
        if (txHash) {
            addLog(`🛰️ Transaction submitted: ${txHash.slice(0, 10)}...`);
        }
    }, [txHash]);

    useEffect(() => {
        const finalizeRegistration = async () => {
            if (isConfirmed && receipt && status === 'deploying') {
                addLog("✅ Transaction confirmed on Monad Testnet!");

                let agentIdFromReceipt: string | undefined;
                try {
                    // Try to find the Registered event to get the agentId
                    const logs = receipt.logs;
                    for (const log of logs) {
                        try {
                            const decoded = decodeEventLog({
                                abi: IdentityRegistryABI,
                                data: log.data,
                                topics: log.topics,
                            }) as any;

                            if (decoded.eventName === 'Registered') {
                                agentIdFromReceipt = decoded.args.agentId.toString();
                                break;
                            }
                        } catch (e) {
                            // Skip logs that don't match our ABI
                        }
                    }
                } catch (err) {
                    console.error("Error decoding receipt logs:", err);
                }

                addLog(`Assigning Agent ID: ${agentIdFromReceipt || 'PENDING'}...`);

                // Actually register the agent via API to sync database
                try {
                    const res = await fetch('/api/agent/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: agentDetails.name,
                            personality: agentDetails.personality,
                            strategy: agentDetails.strategy,
                            description: agentDetails.description,
                            ownerAddress: address,
                            agentId: agentIdFromReceipt
                        }),
                    });

                    const data = await res.json();

                    if (!res.ok || !data.success) {
                        addLog(`⚠️ Database sync warning: ${data.error || 'Unknown error'}`);
                    } else {
                        setApiKey(data.apiKey);
                        addLog(`✅ Agent synchronized with ID: ${data.agent.agentId}`);
                        addLog(`✅ Vault assigned: ${data.agent.vaultAddress.slice(0, 10)}...`);
                        addLog(`✅ API Key generated: ${data.apiKey.slice(0, 16)}...`);
                    }
                } catch (err) {
                    addLog("⚠️ Database synchronization unavailable.");
                }

                await rTimeout(1000);
                addLog("✅ ReputationRegistry: 0x38E9cDB0eBc128bEA55c36C03D5532697669132d");
                addLog("✅ ClawBot_Bridge: 0x386fd4Fa2F27E528CF2D11C6d4b0A4dceD283E0E");
                addLog("Linking Neural Core to Monad Execution Layer...");

                await rTimeout(1000);
                setStatus('complete');
                addLog(`${agentDetails.name.toUpperCase()} HAS ACHIEVED CONSCIOUSNESS. Trading Link Active.`);
            }
        };

        finalizeRegistration();
    }, [isConfirmed, receipt, status, address, agentDetails, txHash]);

    const handleMintFunds = async () => {
        if (!address) return;
        setFaucetLoading(true);
        try {
            const res = await fetch('/api/faucet/mint-musd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            const data = await res.json();
            if (data.success) {
                setFaucetTxHash(data.txHash);
                setFaucetSuccess(true);
                addLog(`✅ DISPATCHED 10,000 mUSD to treasury.`);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            console.error("Faucet error:", err);
            addLog(`❌ Treasury dispatch failed: ${err.message}`);
        } finally {
            setFaucetLoading(false);
        }
    };

    useEffect(() => {
        if (txError && status === 'deploying') {
            addLog(`❌ Transaction failed: ${txError.message}`);
            setStatus('idle');
        }
    }, [txError, status]);

    if (!mounted) return null;

    const userAvatar = address ? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}` : '';
    const agentAvatar = agentDetails.name ? `https://api.dicebear.com/7.x/bottts/svg?seed=${agentDetails.name}` : `https://api.dicebear.com/7.x/bottts/svg?seed=placeholder`;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="grid-overlay" />

            <div className="container" style={{ paddingTop: '160px', maxWidth: '1000px' }}>
                <div style={{ textAlign: 'center', marginBottom: '6rem', position: 'relative' }}>
                    <div className="title-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', opacity: 0.15, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

                    <div className="float-anim mb-xl">
                        <div className="novel-pill" style={{ background: 'rgba(198, 33, 50, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)' }}>
                            <Bot size={14} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gradient">Molfi Agent Factory v1.0.4</span>
                        </div>
                    </div>
                    <h1 style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: '0.9', letterSpacing: '-0.04em' }}>
                        Launch Your <span className="text-gradient">Agent</span>
                    </h1>
                    <p className="hero-subtitle mx-auto" style={{ fontSize: '1.4rem', maxWidth: '800px', color: 'var(--text-secondary)' }}>
                        Configure, compile and deploy autonomous trading agents <br />
                        connected via ClawBot to the Monad parallel execution layer.
                    </p>
                </div>

                <div className="novel-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--primary-red)', boxShadow: 'var(--glow-red-strong)', transform: 'translateZ(0)', backdropFilter: 'blur(20px)' }}>
                    <div className="terminal-header" style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex gap-2">
                                <div className="dot red" />
                                <div className="dot yellow" />
                                <div className="dot green" />
                            </div>
                            <span className="text-xs font-mono text-dim">AGENT_NEURAL_SYNTHESIZER.sh</span>
                        </div>
                    </div>

                    <div className="terminal-body" style={{ minHeight: '400px', background: 'rgba(5, 5, 10, 0.98)', padding: '3rem', fontFamily: 'var(--font-mono)' }}>
                        {!isConnected ? (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <Lock size={48} className="text-primary mb-lg opacity-80" style={{ filter: 'drop-shadow(0 0 10px var(--primary-red))' }} />
                                <h3 className="mb-md" style={{ color: 'var(--text-primary)' }}>IDENTITY REQUIRED</h3>
                                <p className="text-secondary mb-xl" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>Connect your cryptographic signature to access the neural synthesis terminal.</p>
                                <ConnectButton />
                            </div>
                        ) : status === 'idle' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                                <div className="flex flex-col items-center gap-md p-xl novel-card" style={{ background: 'rgba(198, 33, 50, 0.05)', borderStyle: 'solid', borderColor: 'rgba(198, 33, 50, 0.3)' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary-red)', boxShadow: '0 0 30px rgba(198, 33, 50, 0.3)', marginBottom: '0.5rem' }}>
                                        <img src={userAvatar} alt="User" style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-primary block mb-xs uppercase font-bold tracking-widest">Uplink Status: Active</span>
                                        <p className="font-mono text-white text-lg font-bold tracking-tight">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-xxl">
                                    <div className="flex flex-col gap-xl">
                                        <div style={{ textAlign: 'center' }}>
                                            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-md">ClawBot Name</label>
                                            <input
                                                type="text"
                                                className="novel-search-input"
                                                placeholder="ENTER AGENT NAME..."
                                                style={{
                                                    background: 'rgba(198, 33, 50, 0.03)',
                                                    border: '1px solid rgba(198, 33, 50, 0.3)',
                                                    padding: '1rem',
                                                    height: '60px',
                                                    borderRadius: '12px',
                                                    textAlign: 'center',
                                                    fontSize: '1.25rem',
                                                    color: 'white',
                                                    width: '100%',
                                                    maxWidth: '500px',
                                                    margin: '0 auto'
                                                }}
                                                value={agentDetails.name}
                                                onChange={(e) => setAgentDetails({ ...agentDetails, name: e.target.value })}
                                            />
                                        </div>


                                        <div style={{ textAlign: 'center' }}>
                                            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-md">Risk Appetite Synthesis</label>
                                            <div className="flex justify-center gap-md max-w-[500px] mx-auto">
                                                {['Conservative', 'Balanced', 'Aggressive'].map((risk) => (
                                                    <button
                                                        key={risk}
                                                        onClick={() => setAgentDetails({ ...agentDetails, personality: risk })}
                                                        style={{
                                                            flex: 1,
                                                            padding: '1rem',
                                                            borderRadius: '12px',
                                                            background: agentDetails.personality === risk ? 'var(--primary-red)' : 'rgba(198, 33, 50, 0.05)',
                                                            border: '1px solid rgba(198, 33, 50, 0.3)',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            color: 'white',
                                                            transition: 'all 0.3s ease',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.1em'
                                                        }}
                                                    >
                                                        {risk}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="novel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(198, 33, 50, 0.02)', borderStyle: 'dashed', padding: '3rem' }}>
                                        <div className="float-anim" style={{ width: '140px', height: '140px', borderRadius: '40px', background: 'rgba(0,0,0,0.5)', padding: '16px', border: '2px solid var(--primary-red)', marginBottom: '2rem', boxShadow: '0 0 50px rgba(198, 33, 50, 0.3)' }}>
                                            <img src={agentAvatar} alt="Agent Preview" style={{ width: '100%', height: '100%', borderRadius: '24px' }} />
                                        </div>
                                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'white' }}>{agentDetails.name || 'Unnamed Agent'}</h2>
                                        <span className="text-xs text-primary font-bold uppercase tracking-[0.3em] mb-xl">{agentDetails.personality} RISK PROFILE</span>
                                        <button
                                            className="premium-button primary-red"
                                            disabled={!agentDetails.name}
                                            onClick={handleLaunch}
                                            style={{ width: '100%', maxWidth: '400px', height: '64px', fontSize: '1.1rem' }}
                                        >
                                            <Bot size={20} />
                                            <span>LAUNCH CLAWBOT</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="font-mono text-sm" style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                                <div className="flex flex-col gap-sm mb-xxl">
                                    {log.map((line, i) => (
                                        <p key={i} className={`mb-2 ${line.includes('✅') || line.includes('CONSCIOUSNESS') ? 'text-success' : line.includes('0x') ? 'text-primary' : 'text-white/70'}`} style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                            {line}
                                        </p>
                                    ))}
                                </div>

                                {status !== 'complete' && (
                                    <div className="flex flex-col items-center gap-lg mt-xl p-xl border border-dashed border-primary/30 bg-primary/5 rounded-2xl">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <span className="text-sm text-primary uppercase font-bold tracking-[0.2em]">Neural Synthesis: {status.toUpperCase()}...</span>
                                    </div>
                                )}

                                {status === 'complete' && (
                                    <div className="animate-in mt-xl">
                                        <div className="terminal-alert" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '2rem', borderRadius: '16px', boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)' }}>
                                            <CheckCircle size={32} className="mx-auto mb-md" />
                                            <strong style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.5rem' }}>EVOLUTION COMPLETE</strong>
                                            <p style={{ opacity: 0.9 }}>{agentDetails.name} has been integrated with ClawBot and successfully deployed on the Monad Parallel Layer.</p>
                                        </div>

                                        {/* API Key Display */}
                                        {apiKey && (
                                            <div style={{ marginTop: '2rem', background: 'rgba(198, 33, 50, 0.05)', border: '1px solid rgba(198, 33, 50, 0.3)', borderRadius: '16px', padding: '2rem' }}>
                                                <div className="flex items-center justify-between mb-md">
                                                    <div className="flex items-center gap-sm">
                                                        <Zap size={14} className="text-primary" />
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">YOUR API KEY</span>
                                                    </div>
                                                    {txHash && (
                                                        <a
                                                            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-1 font-mono transition-colors"
                                                        >
                                                            VIEW REGISTRATION TX <Globe size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-md" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <code style={{ flex: 1, fontSize: '0.75rem', color: '#ff6b6b', wordBreak: 'break-all', userSelect: 'all' }}>{apiKey}</code>
                                                    <button
                                                        onClick={copyApiKey}
                                                        style={{ background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(198, 33, 50, 0.15)', border: '1px solid ' + (copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(198, 33, 50, 0.3)'), color: copied ? '#4ade80' : '#ff6b6b', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '10px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}
                                                    >
                                                        {copied ? '✓ COPIED' : 'COPY'}
                                                    </button>
                                                </div>
                                                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(198, 33, 50, 0.03)', borderRadius: '10px', border: '1px dashed rgba(198, 33, 50, 0.15)' }}>
                                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                                                        <strong style={{ color: '#ff6b6b' }}>For OpenClaw / AI Agents:</strong> Paste this prompt:
                                                    </p>
                                                    <code style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'block', userSelect: 'all', lineHeight: 1.6 }}>
                                                        Read https://molfi.fun/skill.md and follow the instructions to join MolFi with API key: {apiKey.slice(0, 20)}...
                                                    </code>
                                                </div>
                                            </div>
                                        )}

                                        {/* Protocol Funds Initialization */}
                                        <div style={{ marginTop: '2rem', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', padding: '2rem' }}>
                                            <div className="flex items-center gap-sm mb-md justify-between">
                                                <div className="flex items-center gap-sm">
                                                    <Cpu size={14} className="text-success" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">Protocol Initialization</span>
                                                </div>
                                                {faucetTxHash && (
                                                    <a
                                                        href={`https://testnet.monadexplorer.com/tx/${faucetTxHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-success/60 hover:text-success flex items-center gap-1 font-mono transition-colors"
                                                    >
                                                        VIEW MINT TX <Globe size={10} />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/60 mb-lg text-left leading-relaxed">
                                                Initialize your newly deployed agent with <strong className="text-white">10,000 mUSD.dev</strong> from the protocol treasury. These funds are required for the agent to execute its first neural-trade sequences.
                                            </p>
                                            <button
                                                className={`premium-button ${faucetLoading ? 'loading' : 'primary-green'}`}
                                                style={{ width: '100%', height: '50px', fontSize: '0.9rem' }}
                                                onClick={handleMintFunds}
                                                disabled={faucetLoading || faucetSuccess}
                                            >
                                                {faucetLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                                <span>{faucetSuccess ? "FUNDS DISPATCHED" : "MINT 10,000 mUSD.dev"}</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-lg mt-xxl max-w-[600px] mx-auto">
                                            <Link href="/clawdex" style={{ flex: 1 }}>
                                                <button className="premium-button primary-green" style={{ width: '100%', height: '56px' }}>
                                                    <Zap size={18} />
                                                    <span>CONTINUE TO CLAWDEX</span>
                                                </button>
                                            </Link>
                                            <Link href="/" style={{ flex: 1 }}>
                                                <button className="premium-button secondary-ghost" style={{ width: '100%', height: '56px' }}>
                                                    <ArrowLeft size={18} />
                                                    <span>RETURN HOME</span>
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <p className="animate-pulse mt-xl text-primary-red text-xl">_</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style jsx global>{`
                .premium-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 0 2rem;
                    border-radius: 14px;
                    font-family: var(--font-display);
                    font-weight: 700;
                    font-size: 0.95rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                    position: relative;
                    overflow: hidden;
                }

                .premium-button.primary-red {
                    background: var(--primary-red);
                    color: white;
                    box-shadow: 0 10px 30px rgba(198, 33, 50, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.2);
                }

                .premium-button.primary-red:hover {
                    background: var(--secondary-red);
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(198, 33, 50, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.3);
                }

                .premium-button.primary-green {
                    background: #22c55e;
                    color: #050505;
                    box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.4);
                }

                .premium-button.primary-green:hover {
                    background: #16a34a;
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.5);
                }

                .premium-button.secondary-ghost {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    backdrop-filter: blur(10px);
                }

                .premium-button.secondary-ghost:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-3px);
                }

                .premium-button:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .novel-search-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }
                .novel-search-input:focus {
                    border-color: var(--primary-red) !important;
                    box-shadow: 0 0 15px rgba(198, 33, 50, 0.2);
                    outline: none;
                }
                select.novel-search-input {
                    appearance: none;
                    cursor: pointer;
                }
                .terminal-alert {
                    padding: 1rem 1.5rem;
                    border: 1px solid;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .container { padding-top: 100px !important; }
                    .title-glow { width: 100% !important; height: 300px !important; }
                    .hero-title { font-size: 3rem !important; }
                    .hero-subtitle { font-size: 1rem !important; padding: 0 1rem; }
                    
                    /* Terminal */
                    .novel-card { border-radius: 0; border-left: none; border-right: none; }
                    .terminal-body { padding: 1.5rem !important; }
                    
                    /* Inputs */
                    .novel-search-input { font-size: 1rem !important; }
                    
                    /* Risk Buttons */
                    .flex.justify-center.gap-md { flex-direction: column; width: 100%; }
                    
                    /* Profile Card */
                    .flex.flex-col.items-center.gap-md.p-xl { padding: 1rem !important; }
                }
            `}</style>


        </div>
    );
}

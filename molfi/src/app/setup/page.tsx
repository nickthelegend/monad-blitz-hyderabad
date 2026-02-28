"use client";

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
    Bot,
    CheckCircle,
    Zap,
    TrendingUp,
    Shield,
    Link as LinkIcon,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Cpu,
    Network,
    Lock,
    Globe,
    Terminal
} from 'lucide-react';
import Link from 'next/link';
import { useRegisterAgent } from '@/hooks/useRegisterAgent';
import { createAgentMetadata, uploadToIPFS, validateAgentMetadata } from '@/lib/ipfs';
import { getTxExplorerUrl } from '@/lib/contract-helpers';
import { monadTestnet } from '@/lib/wagmi';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
    name: string;
    description: string;
    agentType: 'fund-manager' | 'trader' | 'analyst';
    riskProfile: 'conservative' | 'balanced' | 'aggressive';
    targetAssets: string[];
    leveragePreference: number;
    tradingStyle: string;
    agentWallet?: string;
    apiEndpoint?: string;
    twitter?: string;
    discord?: string;
}

export default function AgentSetupPage() {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { register, isPending, isConfirming, isConfirmed, hash, error } = useRegisterAgent();

    const [mounted, setMounted] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        agentType: 'fund-manager',
        riskProfile: 'balanced',
        targetAssets: [],
        leveragePreference: 1,
        tradingStyle: 'balanced',
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => { if (currentStep < 5) setCurrentStep((currentStep + 1) as Step); };
    const prevStep = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as Step); };

    const handleRegister = async () => {
        try {
            setIsUploading(true);
            const metadata = createAgentMetadata({
                ...formData,
                chainId,
                agentWallet: formData.agentWallet || address || '',
                socialLinks: {
                    twitter: formData.twitter || '',
                    discord: formData.discord || ''
                },
            });
            validateAgentMetadata(metadata);
            const ipfsURI = await uploadToIPFS(metadata);
            setIsUploading(false);
            await register(ipfsURI);
        } catch (err) {
            console.error('Registration error:', err);
            setIsUploading(false);
        }
    };

    if (!mounted) return null;

    if (!isConnected) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="grid-overlay" />
                <div className="novel-card" style={{ textAlign: 'center', maxWidth: '450px', width: '100%', padding: '4rem' }}>
                    <div className="agent-orb mx-auto mb-lg" style={{ width: '80px', height: '80px' }}>
                        <Terminal size={40} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Initiate Genesis</h1>
                    <p className="text-secondary mb-xl">Connect your cryptographic signature to begin the AI agent instantiation sequence.</p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    if (isConfirmed && hash) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="grid-overlay" />
                <div className="novel-card" style={{ textAlign: 'center', maxWidth: '600px', width: '100%', border: '1px solid var(--primary-purple)' }}>
                    <div className="agent-orb mx-auto mb-lg" style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: '#10b981' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Mind Awakened!</h1>
                    <p className="text-secondary mb-xl">
                        Your agent <strong>{formData.name}</strong> has been successfully instantiated on the Monad network.
                    </p>

                    <div className="novel-card mb-xl" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="text-xs text-dim mb-xs font-mono uppercase">Transaction Hash</div>
                        <p className="text-mono text-[10px] break-all mb-md">{hash}</p>
                        <a href={getTxExplorerUrl(chainId, hash)} target="_blank" className="text-primary text-xs font-bold hover:underline">
                            VIEW ON MONAD EXPLORER →
                        </a>
                    </div>

                    <div className="flex gap-md">
                        <Link href="/profile" className="neon-button flex-1">MY MULTIVERSE</Link>
                        <button onClick={() => window.location.reload()} className="neon-button secondary flex-1">INSTANTIATE NEW</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '6rem' }}>
            <div className="grid-overlay" />

            {/* HEADER */}
            <section className="container pt-xxl mb-xl">
                <div style={{ maxWidth: '800px' }}>
                    <div className="novel-pill mb-md">
                        <Cpu size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gradient-purple">Agent Genesis Protocol</span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: '1' }}>
                        Instantiate Your <span className="text-gradient">AI Persona</span>
                    </h1>
                    <p className="text-secondary text-lg">
                        Define the architecture, risk parameters, and execution strategy for your autonomous digital mind.
                    </p>
                </div>
            </section>

            <section className="container">
                <div className="terminal-grid">
                    {/* Progress Sidebar */}
                    <div className="col-span-4">
                        <div className="novel-card" style={{ position: 'sticky', top: '140px' }}>
                            <div className="flex flex-col gap-lg">
                                {[
                                    { step: 1, label: 'PROTOCOL GENESIS', icon: Terminal },
                                    { step: 2, label: 'COGNITIVE IDENTITY', icon: Bot },
                                    { step: 3, label: 'STRATEGY ENGINE', icon: Zap },
                                    { step: 4, label: 'NETWORK METADATA', icon: Network },
                                    { step: 5, label: 'FINAL COMMIT', icon: Lock }
                                ].map((s) => (
                                    <div key={s.step} className={`flex items-center gap-md transition-all ${currentStep === s.step ? 'opacity-100' : 'opacity-30'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${currentStep === s.step ? 'border-primary bg-primary-05' : 'border-glass-border'}`}>
                                            <s.icon size={16} />
                                        </div>
                                        <span className={`text-xs font-bold tracking-widest ${currentStep === s.step ? 'text-primary' : ''}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="col-span-8">
                        <div className="novel-card py-xl px-xl">
                            {currentStep === 1 && (
                                <div className="animate-in">
                                    <h2 className="mb-lg">The Genesis Standard</h2>
                                    <p className="text-secondary mb-xl">Your agent will be deployed using the MolFi ERC-8004 standard, enabling cross-chain verifiability and decentralized reputation scoring.</p>
                                    <div className="novel-card mb-xxl" style={{ background: 'rgba(168, 85, 247, 0.05)' }}>
                                        <div className="flex items-center gap-md mb-md">
                                            <Globe size={20} className="text-primary" />
                                            <h4 className="m-0 font-bold uppercase text-xs">On-Chain Origin</h4>
                                        </div>
                                        <p className="text-xs text-dim m-0">Owner: {address}</p>
                                    </div>
                                    <button onClick={nextStep} className="neon-button w-full">INITIALIZE NEURAL CORE <ArrowRight size={18} className="ml-sm" /></button>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="animate-in">
                                    <h2 className="mb-lg">Cognitive Identity</h2>
                                    <div className="flex flex-col gap-xl">
                                        <div className="novel-input-group">
                                            <label className="text-xs text-dim uppercase font-bold block mb-sm">Neural Signature Name</label>
                                            <input
                                                type="text"
                                                className="novel-search-input py-md px-md rounded-xl border border-glass-border bg-glass w-full"
                                                placeholder="e.g. Nexus-7-Lambda"
                                                value={formData.name}
                                                onChange={(e) => updateFormData({ name: e.target.value })}
                                            />
                                        </div>
                                        <div className="novel-input-group">
                                            <label className="text-xs text-dim uppercase font-bold block mb-sm">Architectural Purpose</label>
                                            <textarea
                                                className="novel-search-input py-md px-md rounded-xl border border-glass-border bg-glass w-full min-h-[120px]"
                                                placeholder="Define the primary objective of your agent's neural mesh..."
                                                value={formData.description}
                                                onChange={(e) => updateFormData({ description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-md">
                                            {[
                                                { id: 'trader', label: 'TRADER', icon: Zap },
                                                { id: 'fund-manager', label: 'MANAGER', icon: TrendingUp },
                                                { id: 'analyst', label: 'ANALYST', icon: Shield }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => updateFormData({ agentType: t.id as any })}
                                                    className={`novel-card flex flex-col items-center gap-sm transition-all ${formData.agentType === t.id ? 'border-primary ring-1 ring-primary' : ''}`}
                                                >
                                                    <t.icon size={20} className={formData.agentType === t.id ? 'text-primary' : 'text-dim'} />
                                                    <span className="text-[10px] font-bold">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-md mt-xxl">
                                        <button onClick={prevStep} className="neon-button secondary flex-1">BACK</button>
                                        <button onClick={nextStep} className="neon-button flex-1" disabled={!formData.name || !formData.description}>CONTINUE</button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="animate-in">
                                    <h2 className="mb-lg">Strategy Engine</h2>
                                    <div className="flex flex-col gap-xl">
                                        <div className="novel-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                            <label className="text-xs text-dim uppercase font-bold block mb-lg">Risk Bias Calibration</label>
                                            <div className="grid grid-cols-3 gap-sm">
                                                {['conservative', 'balanced', 'aggressive'].map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => updateFormData({ riskProfile: r as any })}
                                                        className={`py-3 rounded-lg text-xs font-bold border transition-all ${formData.riskProfile === r ? 'bg-primary border-primary text-white shadow-luxury' : 'border-glass-border text-dim'}`}
                                                    >
                                                        {r.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-dim uppercase font-bold block mb-md">Leverage Constraint: {formData.leveragePreference}x</label>
                                            <input
                                                type="range" min="1" max="50"
                                                className="w-full custom-range"
                                                value={formData.leveragePreference}
                                                onChange={(e) => updateFormData({ leveragePreference: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-md mt-xxl">
                                        <button onClick={prevStep} className="neon-button secondary flex-1">BACK</button>
                                        <button onClick={nextStep} className="neon-button flex-1">PROCEED TO METADATA</button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="animate-in">
                                    <h2 className="mb-lg">Network Metadata</h2>
                                    <div className="flex flex-col gap-lg">
                                        <div className="novel-input-group">
                                            <label className="text-xs text-dim uppercase font-bold block mb-sm">AI Endpoint (Optional)</label>
                                            <input
                                                type="url" className="novel-search-input py-md px-md rounded-xl border border-glass-border bg-glass w-full"
                                                placeholder="https://api.yourdomain.com/v1/trade"
                                                value={formData.apiEndpoint}
                                                onChange={(e) => updateFormData({ apiEndpoint: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-md">
                                            <div className="novel-input-group">
                                                <label className="text-xs text-dim uppercase font-bold block mb-sm">X (Twitter)</label>
                                                <input
                                                    type="text" className="novel-search-input py-md px-md rounded-xl border border-glass-border bg-glass w-full"
                                                    placeholder="@agent_x"
                                                    value={formData.twitter}
                                                    onChange={(e) => updateFormData({ twitter: e.target.value })}
                                                />
                                            </div>
                                            <div className="novel-input-group">
                                                <label className="text-xs text-dim uppercase font-bold block mb-sm">Discord Server</label>
                                                <input
                                                    type="text" className="novel-search-input py-md px-md rounded-xl border border-glass-border bg-glass w-full"
                                                    placeholder="discord.gg/agent"
                                                    value={formData.discord}
                                                    onChange={(e) => updateFormData({ discord: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-md mt-xxl">
                                        <button onClick={prevStep} className="neon-button secondary flex-1">BACK</button>
                                        <button onClick={nextStep} className="neon-button flex-1">REVIEW GENESIS</button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="animate-in">
                                    <h2 className="mb-lg">Review & Final Commit</h2>
                                    <div className="novel-card mb-xl">
                                        <div className="flex items-center gap-md mb-lg">
                                            <h3 className="m-0 text-gradient-purple">{formData.name}</h3>
                                            <span className="status-badge active">{formData.agentType}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-xl text-sm">
                                            <div>
                                                <span className="text-xs text-dim uppercase block">Strategy</span>
                                                <span className="font-bold">{formData.tradingStyle}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-dim uppercase block">Risk Profile</span>
                                                <span className="font-bold">{formData.riskProfile}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-dim uppercase block">Max Leverage</span>
                                                <span className="font-bold">{formData.leveragePreference}x</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-md">
                                        <button onClick={prevStep} className="neon-button secondary flex-1" disabled={isPending || isConfirming || isUploading}>BACK</button>
                                        <button
                                            onClick={handleRegister}
                                            className="neon-button flex-1"
                                            disabled={isPending || isConfirming || isUploading}
                                        >
                                            {isUploading ? 'IPFS UPLOAD...' : isPending ? 'CHECK WALLET...' : isConfirming ? 'SYNCING...' : 'COMMIT TO NETWORK'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <style jsx global>{`
                .animate-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .novel-search-input:focus { border-color: var(--primary-purple); outline: none; box-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }
                .w-full { width: 100%; }
                .custom-range { -webkit-appearance: none; background: rgba(168, 85, 247, 0.2); height: 6px; border-radius: 10px; }
                .custom-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: var(--primary-purple); border-radius: 50%; cursor: pointer; }

                @media (max-width: 768px) {
                    .terminal-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; gap: 2rem; }
                    .col-span-4 { width: 100%; order: 1; margin-bottom: 1rem; }
                    .col-span-8 { width: 100%; order: 2; }
                    
                    /* Sidebar as horizontal stepper mobile */
                    .col-span-4 .novel-card { 
                        position: static; 
                        padding: 1rem; 
                        overflow-x: auto;
                    }
                    .col-span-4 .flex.flex-col.gap-lg { 
                        flex-direction: row; 
                        gap: 1.5rem; 
                        min-width: max-content;
                    }
                    .text-xs.font-bold.tracking-widest { display: none; } /* Hide labels on mobile stepper */
                    
                    .novel-card.py-xl.px-xl { padding: 1.5rem; }
                    h1 { font-size: 2.5rem !important; }
                    .text-lg { font-size: 1rem; }
                    
                    .grid-cols-3 { grid-template-columns: 1fr; }
                    .grid-cols-2 { grid-template-columns: 1fr; }
                    .flex.gap-md { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}

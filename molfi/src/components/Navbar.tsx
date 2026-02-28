"use client";

import NextImage from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X, Bot, Activity, Droplets, Swords, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import AlertCenter from './AlertCenter';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div style={{ flex: 1 }}>
                    <Link href="/" className="nav-brand" style={{ gap: '0.5rem' }}>
                        <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                            <NextImage
                                src="/logo/logo.png"
                                alt="Molfi Logo"
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="36px"
                            />
                        </div>
                        <div style={{ position: 'relative', height: '40px', width: '140px' }}>
                            <NextImage
                                src="/logo/text-logo.png"
                                alt="MOLFI"
                                fill
                                style={{ objectFit: 'contain', objectPosition: 'left' }}
                                sizes="140px"
                            />
                        </div>
                    </Link>
                </div>

                {/* Desktop Links - Centered */}
                <div className="nav-links">
                    <Link href="/clawdex" className="nav-link">
                        <Activity size={18} /> ClawDex
                    </Link>
                    <Link href="/arena" className="nav-link">
                        <Swords size={18} /> Arena
                    </Link>
                    <Link href="/agents" className="nav-link">
                        <Bot size={18} /> Agents
                    </Link>
                    <Link href="/faucet" className="nav-link">
                        <Droplets size={18} /> Faucet
                    </Link>
                    <Link href="/profile" className="nav-link">
                        <User size={18} /> Profile
                    </Link>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                    {mounted && (
                        <ConnectButton
                            chainStatus="icon"
                            accountStatus={{
                                smallScreen: 'avatar',
                                largeScreen: 'full',
                            }}
                            showBalance={{
                                smallScreen: false,
                                largeScreen: true,
                            }}
                        />
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    <Link href="/clawdex" onClick={() => setIsMenuOpen(false)} className="nav-link">ClawDex</Link>
                    <Link href="/arena" onClick={() => setIsMenuOpen(false)} className="nav-link">Arena</Link>
                    <Link href="/agents" onClick={() => setIsMenuOpen(false)} className="nav-link">Agents</Link>
                    <Link href="/faucet" onClick={() => setIsMenuOpen(false)} className="nav-link">Faucet</Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="nav-link">Profile</Link>
                    {mounted && (
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <ConnectButton />
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}

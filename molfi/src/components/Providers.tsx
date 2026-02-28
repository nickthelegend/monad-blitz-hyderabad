'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const CustomAvatar = ({ address, size }: { address: string; size: number }) => {
        return (
            <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`}
                width={size}
                height={size}
                alt="User Avatar"
                style={{ borderRadius: '25%' }}
            />
        );
    };

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    avatar={CustomAvatar}
                    theme={darkTheme({
                        accentColor: '#c62132',
                        accentColorForeground: '#ffffff',
                        borderRadius: 'medium',
                        fontStack: 'system',
                        overlayBlur: 'small',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

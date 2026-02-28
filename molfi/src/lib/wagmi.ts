import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http, fallback } from 'wagmi';

// Define Monad Testnet
export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: {
            http: ['https://testnet-rpc.monad.xyz']
        },
        public: {
            http: ['https://testnet-rpc.monad.xyz']
        },
    },
    blockExplorers: {
        default: {
            name: 'Monad Explorer',
            url: 'https://testnet.monadexplorer.com'
        },
    },
    testnet: true,
});

export const config = getDefaultConfig({
    appName: 'Molfi Protocol',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'd9938b69371664c9d57189914754c000',
    chains: [
        monadTestnet,
        sepolia,
        mainnet,
        polygon,
        optimism,
        arbitrum,
        base
    ],
    transports: {
        [monadTestnet.id]: fallback([
            http('https://testnet-rpc.monad.xyz', { batch: true, timeout: 30_000 }),
            http('https://monad-testnet.drpc.org', { batch: true, timeout: 30_000 }),
            http('https://10143.rpc.thirdweb.com', { batch: true, timeout: 30_000 }),
        ]),
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [optimism.id]: http(),
        [arbitrum.id]: http(),
        [base.id]: http(),
    },
    ssr: true,
});

/**
 * Contract Helper Functions
 * 
 * Utilities for interacting with ERC-8004 contracts
 */

/**
 * Format feedback value for on-chain storage
 * @param value - The numeric value (e.g., 99.77 or 560)
 * @param decimals - Number of decimal places (0-18)
 * @returns Tuple of [value as bigint, decimals]
 */
export function formatFeedbackValue(
    value: number,
    decimals: number = 2
): [bigint, number] {
    if (decimals < 0 || decimals > 18) {
        throw new Error('Decimals must be between 0 and 18');
    }

    const multiplier = Math.pow(10, decimals);
    const intValue = Math.round(value * multiplier);

    return [BigInt(intValue), decimals];
}

/**
 * Parse feedback value from on-chain storage
 * @param value - The bigint value from contract
 * @param decimals - Number of decimal places
 * @returns The numeric value as a number
 */
export function parseFeedbackValue(
    value: bigint,
    decimals: number
): number {
    const divisor = Math.pow(10, decimals);
    return Number(value) / divisor;
}

/**
 * Format agent registry identifier
 * @param chainId - The chain ID
 * @param registryAddress - The registry contract address
 * @returns Formatted agent registry string (e.g., "eip155:10143:0x...")
 */
export function formatAgentRegistry(
    chainId: number,
    registryAddress: string
): string {
    return `eip155:${chainId}:${registryAddress}`;
}

/**
 * Parse agent registry identifier
 * @param agentRegistry - The agent registry string
 * @returns Object with namespace, chainId, and address
 */
export function parseAgentRegistry(agentRegistry: string): {
    namespace: string;
    chainId: number;
    address: string;
} {
    const parts = agentRegistry.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid agent registry format');
    }

    return {
        namespace: parts[0],
        chainId: parseInt(parts[1]),
        address: parts[2],
    };
}

/**
 * Shorten address for display
 * @param address - Full address
 * @param chars - Number of characters to show on each side
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(
    address: string,
    chars: number = 4
): string {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;

    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate reputation score from feedback summary
 * @param summaryValue - The summary value from contract
 * @param summaryDecimals - The decimals for summary value
 * @param count - Number of feedback entries
 * @returns Reputation score (0-100)
 */
export function calculateReputationScore(
    summaryValue: bigint,
    summaryDecimals: number,
    count: bigint
): number {
    if (count === 0n) return 0;

    const average = parseFeedbackValue(summaryValue, summaryDecimals);
    const normalized = Math.min(Math.max(average, 0), 100);

    return Math.round(normalized);
}

/**
 * Format timestamp for display
 * @param timestamp - Unix timestamp (seconds)
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Validate Ethereum address
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get explorer URL for address
 * @param chainId - Chain ID
 * @param address - Contract or wallet address
 * @returns Explorer URL
 */
export function getExplorerUrl(
    chainId: number,
    address: string
): string {
    const explorers: Record<number, string> = {
        10143: 'https://monad-testnet.socialscan.io',
        11155111: 'https://sepolia.etherscan.io',
        84532: 'https://sepolia.basescan.org',
    };

    const baseUrl = explorers[chainId] || 'https://etherscan.io';
    return `${baseUrl}/address/${address}`;
}

/**
 * Get transaction explorer URL
 * @param chainId - Chain ID
 * @param txHash - Transaction hash
 * @returns Explorer URL
 */
export function getTxExplorerUrl(
    chainId: number,
    txHash: string
): string {
    const explorers: Record<number, string> = {
        10143: 'https://monad-testnet.socialscan.io',
        11155111: 'https://sepolia.etherscan.io',
        84532: 'https://sepolia.basescan.org',
    };

    const baseUrl = explorers[chainId] || 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
}

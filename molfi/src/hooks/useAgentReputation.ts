import { useReadContract, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import ReputationRegistryABI from '@/abis/ReputationRegistry.json';

/**
 * Hook to read agent reputation summary
 * @param agentId - The agent ID
 * @param clientAddresses - Array of client addresses to filter by
 * @returns Reputation summary with count and average value
 */
export function useAgentReputation(
    agentId: bigint | undefined,
    clientAddresses: `0x${string}`[] = []
) {
    const chainId = useChainId();
    const contractAddress = getContractAddress(chainId, 'reputationRegistry');

    const { data, isLoading, error } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: ReputationRegistryABI,
        functionName: 'getSummary',
        args: agentId !== undefined && clientAddresses.length > 0
            ? [agentId, clientAddresses, '', '', false]
            : undefined,
    });

    // Parse the summary data
    const summary = data as [bigint, bigint, number] | undefined;

    return {
        count: summary?.[0],
        summaryValue: summary?.[1],
        summaryValueDecimals: summary?.[2],
        isLoading,
        error,
    };
}

/**
 * Hook to read individual feedback
 * @param agentId - The agent ID
 * @param clientAddress - The client who gave feedback
 * @param feedbackIndex - The index of the feedback
 * @returns Individual feedback data
 */
export function useFeedback(
    agentId: bigint | undefined,
    clientAddress: `0x${string}` | undefined,
    feedbackIndex: bigint | undefined
) {
    const chainId = useChainId();
    const contractAddress = getContractAddress(chainId, 'reputationRegistry');

    const { data, isLoading } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: ReputationRegistryABI,
        functionName: 'readFeedback',
        args: agentId !== undefined && clientAddress && feedbackIndex !== undefined
            ? [agentId, clientAddress, feedbackIndex]
            : undefined,
    });

    return {
        feedback: data,
        isLoading,
    };
}

import { useReadContract, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import IdentityRegistryABI from '@/abis/IdentityRegistry.json';

/**
 * Hook to read agent data from the IdentityRegistry
 * @param agentId - The agent ID (token ID)
 * @returns Agent data including URI and metadata
 */
export function useAgentData(agentId: bigint | undefined) {
    const chainId = useChainId();
    const contractAddress = getContractAddress(chainId, 'identityRegistry');

    // Get agent URI
    const { data: agentURI, isLoading: isLoadingURI } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'tokenURI',
        args: agentId !== undefined ? [agentId] : undefined,
    });

    // Get agent owner
    const { data: owner, isLoading: isLoadingOwner } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'ownerOf',
        args: agentId !== undefined ? [agentId] : undefined,
    });

    // Get agent wallet
    const { data: agentWallet, isLoading: isLoadingWallet } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'getAgentWallet',
        args: agentId !== undefined ? [agentId] : undefined,
    });

    return {
        agentURI: agentURI as string | undefined,
        owner: owner as `0x${string}` | undefined,
        agentWallet: agentWallet as `0x${string}` | undefined,
        isLoading: isLoadingURI || isLoadingOwner || isLoadingWallet,
    };
}

/**
 * Hook to get total number of registered agents
 * @returns Total supply of agent NFTs
 */
export function useTotalAgents() {
    const chainId = useChainId();
    const contractAddress = getContractAddress(chainId, 'identityRegistry');

    const { data: totalSupply, isLoading } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'totalSupply',
    });

    return {
        totalAgents: totalSupply as bigint | undefined,
        isLoading,
    };
}

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import IdentityRegistryABI from '@/abis/IdentityRegistry.json';

/**
 * Hook to register a new AI agent on-chain
 * @returns Object with register function and transaction state
 */
export function useRegisterAgent() {
    const chainId = useChainId();
    const {
        writeContract,
        data: hash,
        isPending,
        isError,
        error
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        data: receipt
    } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Register a new agent
     * @param agentURI - IPFS URI pointing to agent metadata
     * @returns Promise that resolves when transaction is submitted
     */
    const register = async (agentURI: string) => {
        try {
            const contractAddress = getContractAddress(chainId, 'identityRegistry');

            return writeContract({
                address: contractAddress as `0x${string}`,
                abi: IdentityRegistryABI,
                functionName: 'register',
                args: [agentURI],
            });
        } catch (err) {
            console.error('Error registering agent:', err);
            throw err;
        }
    };

    return {
        register,
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error,
        receipt,
    };
}

import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import ReputationRegistryABI from '@/abis/ReputationRegistry.json';

export interface FeedbackParams {
    agentId: bigint;
    value: bigint;
    valueDecimals: number;
    tag1?: string;
    tag2?: string;
    feedbackURI?: string;
    feedbackHash?: string;
}

/**
 * Hook to give feedback to an AI agent
 * @returns Object with giveFeedback function and transaction state
 */
export function useGiveFeedback() {
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
        isSuccess: isConfirmed
    } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Submit feedback for an agent
     * @param params - Feedback parameters
     */
    const giveFeedback = async (params: FeedbackParams) => {
        try {
            const contractAddress = getContractAddress(chainId, 'reputationRegistry');

            return writeContract({
                address: contractAddress as `0x${string}`,
                abi: ReputationRegistryABI,
                functionName: 'giveFeedback',
                args: [
                    params.agentId,
                    params.value,
                    params.valueDecimals,
                    params.tag1 || '',
                    params.tag2 || '',
                    params.feedbackURI || '',
                    params.feedbackHash || '',
                ],
            });
        } catch (err) {
            console.error('Error giving feedback:', err);
            throw err;
        }
    };

    return {
        giveFeedback,
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error,
    };
}

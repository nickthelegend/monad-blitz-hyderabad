import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import VaultFactoryABI from '@/abis/MolfiVaultFactory.json';

/**
 * Hook to interact with the MolfiVaultFactory
 */
export function useVaultFactory() {
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
     * Deploy a vault for an agent
     * @param agentId - The ID of the registered agent
     * @param name - The name of the vault (e.g., "Molfi Alpha Vault")
     * @param symbol - The symbol of the vault (e.g., "MALPHA")
     */
    const deployVault = async (agentId: bigint, name: string, symbol: string) => {
        try {
            const contractAddress = getContractAddress(chainId, 'vaultFactory');

            return writeContract({
                address: contractAddress as `0x${string}`,
                abi: VaultFactoryABI,
                functionName: 'deployVault',
                args: [agentId, name, symbol],
            });
        } catch (err) {
            console.error('Error deploying vault:', err);
            throw err;
        }
    };

    return {
        deployVault,
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error,
        receipt,
    };
}

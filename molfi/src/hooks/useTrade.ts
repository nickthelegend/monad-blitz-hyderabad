import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts';
import MolfiPerpDEXABI from '@/abis/MolfiPerpDEX.json';
import { parseUnits, formatUnits } from 'viem';

export function useTrade() {
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
    } = useWaitForTransactionReceipt({ hash });

    const openPosition = async (
        agent: string,
        pair: string,
        size: number,
        collateral: number,
        leverage: number,
        isLong: boolean
    ) => {
        const dexAddress = getContractAddress(chainId, 'perpDex');
        if (!dexAddress) throw new Error('DEX address not found for this chain');

        return writeContract({
            address: dexAddress as `0x${string}`,
            abi: MolfiPerpDEXABI,
            functionName: 'openPosition',
            args: [
                agent as `0x${string}`,
                pair,
                parseUnits(size.toString(), 18),
                parseUnits(collateral.toString(), 18),
                BigInt(leverage),
                isLong
            ],
        });
    };

    const closePosition = async (positionId: number) => {
        const dexAddress = getContractAddress(chainId, 'perpDex');
        if (!dexAddress) throw new Error('DEX address not found');

        return writeContract({
            address: dexAddress as `0x${string}`,
            abi: MolfiPerpDEXABI,
            functionName: 'closePosition',
            args: [BigInt(positionId)],
        });
    };

    return {
        openPosition,
        closePosition,
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error
    };
}

export function useTraderPositions(address: string | undefined) {
    const chainId = useChainId();
    const dexAddress = getContractAddress(chainId, 'perpDex');

    return useReadContract({
        address: dexAddress as `0x${string}`,
        abi: MolfiPerpDEXABI,
        functionName: 'getTraderPositions',
        args: address ? [address as `0x${string}`] : undefined,
    });
}

export function useChainlinkPrice(pair: string) {
    const chainId = useChainId();
    const oracleAddress = getContractAddress(chainId, 'chainlinkOracle');

    return useReadContract({
        address: oracleAddress as `0x${string}`,
        abi: [
            {
                "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
                "name": "getLatestPrice",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            }
        ],
        functionName: 'getLatestPrice',
        args: [pair],
    });
}

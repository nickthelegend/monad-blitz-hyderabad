import { useReadContract, useChainId } from 'wagmi';

// Validator ABI (minimal for our needs)
const VALIDATOR_ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "bool", "name": "hasStrategy", "type": "bool" },
            { "internalType": "bool", "name": "hasWallet", "type": "bool" }
        ],
        "name": "validateMetadata",
        "outputs": [{ "internalType": "uint8", "name": "score", "type": "uint8" }],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint8", "name": "score", "type": "uint8" }],
        "name": "getValidationStatus",
        "outputs": [{ "internalType": "string", "name": "status", "type": "string" }],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint8", "name": "score", "type": "uint8" }],
        "name": "meetsMinimumRequirements",
        "outputs": [{ "internalType": "bool", "name": "isValid", "type": "bool" }],
        "stateMutability": "pure",
        "type": "function"
    }
] as const;

/**
 * Get validator contract address for current chain
 */
function getValidatorAddress(chainId: number): string {
    // For now, return env variable
    // After deployment, this can be hardcoded per chain
    return process.env.NEXT_PUBLIC_VALIDATOR_CONTRACT || '';
}

/**
 * Hook to validate agent metadata
 * @param name - Agent name
 * @param description - Agent description
 * @param hasStrategy - Whether agent has strategy
 * @param hasWallet - Whether agent has wallet
 * @returns Validation score and status
 */
export function useValidateAgent(
    name: string,
    description: string,
    hasStrategy: boolean,
    hasWallet: boolean
) {
    const chainId = useChainId();
    const validatorAddress = getValidatorAddress(chainId);

    // Get validation score
    const { data: score, isLoading: isLoadingScore } = useReadContract({
        address: validatorAddress as `0x${string}`,
        abi: VALIDATOR_ABI,
        functionName: 'validateMetadata',
        args: [name, description, hasStrategy, hasWallet],
    });

    // Get validation status
    const { data: status, isLoading: isLoadingStatus } = useReadContract({
        address: validatorAddress as `0x${string}`,
        abi: VALIDATOR_ABI,
        functionName: 'getValidationStatus',
        args: score !== undefined ? [score] : undefined,
    });

    // Check if meets requirements
    const { data: meetsRequirements, isLoading: isLoadingRequirements } = useReadContract({
        address: validatorAddress as `0x${string}`,
        abi: VALIDATOR_ABI,
        functionName: 'meetsMinimumRequirements',
        args: score !== undefined ? [score] : undefined,
    });

    return {
        score: score as number | undefined,
        status: status as string | undefined,
        meetsRequirements: meetsRequirements as boolean | undefined,
        isLoading: isLoadingScore || isLoadingStatus || isLoadingRequirements,
    };
}

/**
 * Client-side validation (instant feedback)
 * @param name - Agent name
 * @param description - Agent description
 * @param hasStrategy - Whether agent has strategy
 * @param hasWallet - Whether agent has wallet
 * @returns Validation result
 */
export function validateAgentClient(
    name: string,
    description: string,
    hasStrategy: boolean,
    hasWallet: boolean
): {
    score: number;
    status: string;
    meetsRequirements: boolean;
    errors: string[];
} {
    let score = 0;
    const errors: string[] = [];

    // Validate name (20 points)
    if (name.length >= 3 && name.length <= 50) {
        score += 20;
    } else if (name.length > 0) {
        score += 10;
        if (name.length < 3) errors.push('Name must be at least 3 characters');
        if (name.length > 50) errors.push('Name must be at most 50 characters');
    } else {
        errors.push('Name is required');
    }

    // Validate description (20 points)
    if (description.length >= 10 && description.length <= 500) {
        score += 20;
    } else if (description.length > 0) {
        score += 10;
        if (description.length < 10) errors.push('Description must be at least 10 characters');
        if (description.length > 500) errors.push('Description must be at most 500 characters');
    } else {
        errors.push('Description is required');
    }

    // Validate strategy (30 points)
    if (hasStrategy) {
        score += 30;
    } else {
        errors.push('Strategy configuration is required');
    }

    // Validate wallet (15 points)
    if (hasWallet) {
        score += 15;
    }

    // Metadata completeness (15 points)
    if (score >= 85) {
        score += 15;
    }

    // Determine status
    let status: string;
    if (score >= 90) {
        status = "Excellent - Highly trusted agent";
    } else if (score >= 75) {
        status = "Good - Trusted agent";
    } else if (score >= 60) {
        status = "Acceptable - Meets minimum requirements";
    } else if (score >= 40) {
        status = "Poor - Missing key information";
    } else {
        status = "Failed - Does not meet requirements";
    }

    return {
        score,
        status,
        meetsRequirements: score >= 60,
        errors,
    };
}

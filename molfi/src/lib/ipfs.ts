/**
 * IPFS Helper Functions
 * 
 * Utilities for uploading and fetching agent metadata from IPFS
 */

export interface AgentMetadata {
    type: string;
    name: string;
    description: string;
    image?: string;
    agentRegistry: string;
    agentId?: string;
    strategy?: {
        riskProfile: 'conservative' | 'balanced' | 'aggressive';
        targetAssets: string[];
        leveragePreference: number;
        tradingStyle: string;
    };
    services?: Array<{
        type: string;
        endpoint: string;
    }>;
    metadata?: Record<string, any>;
}

/**
 * Upload agent metadata to IPFS using Pinata
 * @param metadata - Agent metadata object
 * @param apiKey - Pinata API key
 * @param secretKey - Pinata secret key
 * @returns IPFS URI (ipfs://...)
 */
export async function uploadToIPFS(
    metadata: AgentMetadata,
    apiKey?: string,
    secretKey?: string
): Promise<string> {
    // Use Pinata API
    const pinataApiKey = apiKey || process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = secretKey || process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API credentials not configured');
    }

    try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey,
            },
            body: JSON.stringify({
                pinataContent: metadata,
                pinataMetadata: {
                    name: `agent-${metadata.name}-metadata.json`,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Pinata API error: ${response.statusText}`);
        }

        const data = await response.json();
        return `ipfs://${data.IpfsHash}`;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

/**
 * Fetch agent metadata from IPFS
 * @param ipfsURI - IPFS URI (ipfs://... or https://...)
 * @returns Agent metadata object
 */
export async function fetchFromIPFS(ipfsURI: string): Promise<AgentMetadata> {
    try {
        // Convert ipfs:// to https:// gateway URL
        let url = ipfsURI;
        if (ipfsURI.startsWith('ipfs://')) {
            const hash = ipfsURI.replace('ipfs://', '');
            url = `https://gateway.pinata.cloud/ipfs/${hash}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }

        const metadata = await response.json();
        return metadata as AgentMetadata;
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        throw error;
    }
}

/**
 * Create agent metadata object from form data
 * @param formData - Form data from registration wizard
 * @returns Formatted agent metadata
 */
export function createAgentMetadata(formData: {
    name: string;
    description: string;
    image?: string;
    chainId: number;
    agentId?: string;
    riskProfile?: 'conservative' | 'balanced' | 'aggressive';
    targetAssets?: string[];
    leveragePreference?: number;
    tradingStyle?: string;
    agentWallet?: string;
    apiEndpoint?: string;
    socialLinks?: Record<string, string>;
}): AgentMetadata {
    const metadata: AgentMetadata = {
        type: 'erc8004-agent-registration-v1',
        name: formData.name,
        description: formData.description,
        image: formData.image,
        agentRegistry: `eip155:${formData.chainId}:0x...`, // Will be updated with actual address
        agentId: formData.agentId,
    };

    // Add strategy if provided
    if (formData.riskProfile) {
        metadata.strategy = {
            riskProfile: formData.riskProfile,
            targetAssets: formData.targetAssets || [],
            leveragePreference: formData.leveragePreference || 1,
            tradingStyle: formData.tradingStyle || 'balanced',
        };
    }

    // Add services if provided
    const services: Array<{ type: string; endpoint: string }> = [];

    if (formData.apiEndpoint) {
        services.push({
            type: 'api',
            endpoint: formData.apiEndpoint,
        });
    }

    if (services.length > 0) {
        metadata.services = services;
    }

    // Add additional metadata
    if (formData.agentWallet || formData.socialLinks) {
        metadata.metadata = {
            agentWallet: formData.agentWallet,
            ...formData.socialLinks,
        };
    }

    return metadata;
}

/**
 * Validate agent metadata
 * @param metadata - Agent metadata to validate
 * @returns True if valid, throws error if invalid
 */
export function validateAgentMetadata(metadata: AgentMetadata): boolean {
    if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {
        throw new Error('Agent name must be between 3 and 50 characters');
    }

    if (!metadata.description || metadata.description.length < 10) {
        throw new Error('Agent description must be at least 10 characters');
    }

    if (!metadata.type || !metadata.type.startsWith('erc8004')) {
        throw new Error('Invalid metadata type');
    }

    return true;
}

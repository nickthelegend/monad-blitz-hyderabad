"use client";

import { useState, useEffect, use, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, decodeEventLog } from 'viem';
import { Activity, Bot } from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AgentPerformanceChart from '@/components/AgentPerformanceChart';
import ClawbotLoader from '@/components/ClawbotLoader';
import MolfiAgentVaultABI from '@/abis/MolfiAgentVault.json';
import { shortenAddress, getExplorerUrl } from '@/lib/contract-helpers';
import Script from 'next/script';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC as `0x${string}`;

const USDC_ABI = [
    { "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="grid-overlay" />
            <ClawbotLoader message="INITIALIZING INTERFACE..." />
        </div>
    );

    return <AgentDetailPageContent id={id} />;
}

function AgentDetailPageContent({ id }: { id: string }) {
    const [agent, setAgent] = useState<any | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [posTab, setPosTab] = useState<'active' | 'completed'>('active');
    const { isConnected, address } = useAccount();

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const res = await fetch(`/api/agents/${id}`);
                const data = await res.json();
                if (data.success) {
                    setAgent(data.agent);
                }
            } catch (err) {
                console.error("Failed to fetch agent:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAgent();
    }, [id]);

    const [step, setStep] = useState<'idle' | 'approving' | 'waiting_approve' | 'depositing' | 'waiting_deposit' | 'success' | 'error' | 'syncing'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
    const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>();
    const [reputationLogs, setReputationLogs] = useState<any[]>([]);
    const [netDeposits, setNetDeposits] = useState<bigint>(0n);
    const [withdrawStep, setWithdrawStep] = useState<'idle' | 'withdrawing' | 'waiting_withdraw' | 'success' | 'error'>('idle');
    const [withdrawError, setWithdrawError] = useState<string | null>(null);
    const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | undefined>();
    const [totalDeposited, setTotalDeposited] = useState<bigint>(0n);
    const [isFullWithdraw, setIsFullWithdraw] = useState(false);

    const REPUTATION_REGISTRY = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY as `0x${string}`;
    const PROTOCOL_CLIENT = '0xcCED528A5b70e16c8131Cb2de424564dD938fD3B' as `0x${string}`; // Deployer address

    // 0. Fetch Reputation Logs from Chain
    const { data: feedbackData, isLoading: feedbackLoading, refetch: refetchReputation } = useReadContract({
        address: REPUTATION_REGISTRY,
        abi: [
            {
                "inputs": [
                    { "internalType": "uint256", "name": "agentId", "type": "uint256" },
                    { "internalType": "address[]", "name": "clientAddresses", "type": "address[]" },
                    { "internalType": "string", "name": "tag1", "type": "string" },
                    { "internalType": "string", "name": "tag2", "type": "string" },
                    { "internalType": "bool", "name": "includeRevoked", "type": "bool" }
                ],
                "name": "readAllFeedback",
                "outputs": [
                    { "internalType": "address[]", "name": "clients", "type": "address[]" },
                    { "internalType": "uint64[]", "name": "feedbackIndexes", "type": "uint64[]" },
                    { "internalType": "int128[]", "name": "values", "type": "int128[]" },
                    { "internalType": "uint8[]", "name": "valueDecimals", "type": "uint8[]" },
                    { "internalType": "string[]", "name": "tag1s", "type": "string[]" },
                    { "internalType": "string[]", "name": "tag2s", "type": "string[]" },
                    { "internalType": "bool[]", "name": "revokedStatuses", "type": "bool[]" }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ],
        functionName: "readAllFeedback",
        args: agent?.agentId ? [BigInt(agent.agentId), [], "", "", false] : undefined,
    });

    useEffect(() => {
        if (feedbackData) {
            const [clients, indexes, values, decimals, tag1s, tag2s] = feedbackData as any;
            const logs = tag1s.map((tag1: string, i: number) => ({
                action: tag1,
                pair: tag2s[i],
                value: Number(values[i]) / (10 ** Number(decimals[i])),
                index: Number(indexes[i]),
                client: clients[i]
            })).reverse();
            setReputationLogs(logs);
        }
    }, [feedbackData]);

    // 1. Fetch USDC Balance
    const { data: usdcBalanceData } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    });

    // 1b. Fetch Vault Balance (Total Assets)
    const { data: vaultAssets } = useReadContract({
        address: agent?.vaultAddress as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: "totalAssets",
        args: undefined,
        query: {
            enabled: !!agent?.vaultAddress,
        } // Fix: Use query object for enabled
    });

    const vaultBalance = vaultAssets ? formatEther(vaultAssets as bigint) : "0.00";

    // 1c. Fetch Investor Count via Events
    const publicClient = usePublicClient();
    const [investorCount, setInvestorCount] = useState<number>(0);

    useEffect(() => {
        if (!agent?.vaultAddress || !publicClient) return;

        const fetchInvestors = async () => {
            try {
                // Get Deposit content hash from ABI or known signature
                // Event: Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)
                // Keccak256("Deposit(address,address,uint256,uint256)")
                // = 0xdcbc1c05240f31ff3ad067ef1ee35cebc99cdc8e96f9a0ddc743fdacaa648873 (standard ERC4626)

                const logs = await publicClient.getLogs({
                    address: agent.vaultAddress as `0x${string}`,
                    event: {
                        type: 'event',
                        name: 'Deposit',
                        inputs: [
                            { type: 'address', indexed: true, name: 'sender' },
                            { type: 'address', indexed: true, name: 'owner' },
                            { type: 'uint256', indexed: false, name: 'assets' },
                            { type: 'uint256', indexed: false, name: 'shares' }
                        ]
                    },
                    fromBlock: 'earliest'
                });

                const uniqueInvestors = new Set(logs.map(log => log.args.owner));
                setInvestorCount(uniqueInvestors.size);
            } catch (err) {
                console.error("Error fetching investor count:", err);
            }
        };

        fetchInvestors();
    }, [agent?.vaultAddress, publicClient]);

    // 2. Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: address && agent?.vaultAddress ? [address, agent.vaultAddress as `0x${string}`] : undefined,
    });

    // 2b. Fetch User Share Balance + Max Withdraw
    const { data: shareBalance, refetch: refetchShareBalance } = useReadContract({
        address: agent?.vaultAddress as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: {
            enabled: !!agent?.vaultAddress && !!address,
        },
    });

    const { data: maxWithdraw, refetch: refetchMaxWithdraw } = useReadContract({
        address: agent?.vaultAddress as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: "maxWithdraw",
        args: address ? [address] : undefined,
        query: {
            enabled: !!agent?.vaultAddress && !!address,
        },
    });

    const { data: assetsFromShares, refetch: refetchAssetsFromShares } = useReadContract({
        address: agent?.vaultAddress as `0x${string}`,
        abi: MolfiAgentVaultABI,
        functionName: "convertToAssets",
        args: shareBalance ? [shareBalance as bigint] : undefined,
        query: {
            enabled: !!agent?.vaultAddress && !!address && !!shareBalance,
        },
    });

    const { writeContractAsync } = useWriteContract();

    // Derived State
    const formattedBalance = usdcBalanceData ? formatEther(usdcBalanceData) : "0.00";
    const currentAssets = assetsFromShares ? (assetsFromShares as bigint) : 0n;
    const maxWithdrawAmount = (maxWithdraw as bigint | undefined) || 0n;

    // Fix: Profit is everything above the total principal deposited
    const pnlAvailable = maxWithdrawAmount > totalDeposited ? maxWithdrawAmount - totalDeposited : 0n;

    const currentAssetsDisplay = formatEther(currentAssets);
    const totalDepositedDisplay = formatEther(totalDeposited);
    const pnlAvailableDisplay = formatEther(pnlAvailable);

    // 3. Wait for approve tx confirmation
    const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
        hash: approveTxHash,
    });

    // 4. Wait for deposit tx confirmation
    const { isSuccess: depositConfirmed, data: depositReceipt } = useWaitForTransactionReceipt({
        hash: depositTxHash,
    });

    // 4b. Wait for withdraw tx confirmation
    const { isSuccess: withdrawConfirmed } = useWaitForTransactionReceipt({
        hash: withdrawTxHash,
    });

    // When approve is confirmed, proceed to deposit
    useEffect(() => {
        if (approveConfirmed && step === 'waiting_approve') {
            refetchAllowance();
            executeDeposit();
        }
    }, [approveConfirmed]);

    // When deposit is confirmed, show success
    // When deposit is confirmed, show success and register investment
    useEffect(() => {
        if (depositConfirmed && step === 'waiting_deposit') {
            const registerInvestment = async () => {
                setStep('syncing');
                try {
                    let mintedShares = stakeAmount; // Default to 1:1 fallback

                    if (depositReceipt) {
                        for (const log of depositReceipt.logs) {
                            try {
                                if (log.address.toLowerCase() === agent.vaultAddress.toLowerCase()) {
                                    const event = decodeEventLog({
                                        abi: MolfiAgentVaultABI,
                                        data: log.data,
                                        topics: log.topics,
                                    });
                                    if (event.eventName === 'Deposit') {
                                        // args: { sender, owner, assets, shares }
                                        if (event.args && (event.args as any).shares) {
                                            mintedShares = formatEther((event.args as any).shares);
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore parsing errors for non-matching logs
                            }
                        }
                    }

                    console.log("Registering investment:", {
                        txHash: depositTxHash,
                        agentId: agent.agentId,
                        shares: mintedShares,
                        amount: stakeAmount
                    });

                    await fetch('/api/investments/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            txHash: depositTxHash,
                            agentId: agent.agentId,
                            userAddress: address,
                            amount: stakeAmount,
                            shares: mintedShares
                        })
                    });

                } catch (e) {
                    console.error("Failed to register investment:", e);
                }

                setStep('success');
                setStakeAmount('');
                setTimeout(() => setStep('idle'), 3000);
            };

            registerInvestment();
        }
    }, [depositConfirmed, depositReceipt]);

    // When withdraw is confirmed, sync with Supabase and show success
    useEffect(() => {
        if (withdrawConfirmed && withdrawStep === 'waiting_withdraw') {
            const syncWithdrawal = async () => {
                try {
                    console.log(`[Sync] Registering withdrawal in DB. Full: ${isFullWithdraw}`);
                    await fetch('/api/investments/sync-withdrawal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userAddress: address,
                            agentId: agent.agentId,
                            isFullWithdraw: isFullWithdraw
                        })
                    });
                } catch (e) {
                    console.error("Failed to sync withdrawal:", e);
                }
                setWithdrawStep('success');
                setWithdrawError(null);
                setTimeout(() => {
                    setWithdrawStep('idle');
                    setIsFullWithdraw(false);
                }, 3000);
            };
            syncWithdrawal();
        }
    }, [withdrawConfirmed]);

    // Compute net deposits for current wallet AND Sync missing investments
    const fetchNetDeposits = useCallback(async () => {
        if (!agent?.vaultAddress || !publicClient || !address || !agent?.agentId) {
            setNetDeposits(0n);
            setTotalDeposited(0n);
            return;
        }

        try {
            // 1. Fetch DB Investments 
            const dbRes = await fetch(`/api/investments/user/${address}`);
            const dbData = await dbRes.json();
            const dbInvestments = dbData.success ? dbData.investments : [];

            // Only consider investments for THIS agent
            const agentInvestments = dbInvestments.filter((i: any) => String(i.agent_id) === String(agent.agentId));

            // Filter ensuring we match lowercase hash for sync check
            const knownTxHashes = new Set(
                agentInvestments.map((i: any) => i.tx_hash.toLowerCase())
            );

            const [depositLogs, withdrawLogs] = await Promise.all([
                publicClient.getLogs({
                    address: agent.vaultAddress as `0x${string}`,
                    event: {
                        type: 'event',
                        name: 'Deposit',
                        inputs: [
                            { type: 'address', indexed: true, name: 'sender' },
                            { type: 'address', indexed: true, name: 'owner' },
                            { type: 'uint256', indexed: false, name: 'assets' },
                            { type: 'uint256', indexed: false, name: 'shares' }
                        ]
                    },
                    args: { owner: address },
                    fromBlock: 'earliest'
                }),
                publicClient.getLogs({
                    address: agent.vaultAddress as `0x${string}`,
                    event: {
                        type: 'event',
                        name: 'Withdraw',
                        inputs: [
                            { type: 'address', indexed: true, name: 'sender' },
                            { type: 'address', indexed: true, name: 'receiver' },
                            { type: 'address', indexed: true, name: 'owner' },
                            { type: 'uint256', indexed: false, name: 'assets' },
                            { type: 'uint256', indexed: false, name: 'shares' }
                        ]
                    },
                    args: { owner: address },
                    fromBlock: 'earliest'
                })
            ]);

            // Sync Logic: Check for withdrawals
            // If user has ACTIVE investments in DB but 0 balance on-chain, mark CLOSED
            const activeAgentInvestments = agentInvestments.filter((i: any) => i.status === 'ACTIVE');
            if (activeAgentInvestments.length > 0) {
                try {
                    const balance = await publicClient.readContract({
                        address: agent.vaultAddress as `0x${string}`,
                        abi: MolfiAgentVaultABI,
                        functionName: 'balanceOf',
                        args: [address]
                    }) as bigint;

                    if (balance === 0n) {
                        console.log("SYNC: Marking agent investments CLOSED due to 0 balance");
                        await fetch('/api/investments/sync-withdrawal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userAddress: address,
                                agentId: agent.agentId,
                                isFullWithdraw: true
                            })
                        });
                        // Update the local list so calculation is correct immediately
                        activeAgentInvestments.forEach((inv: any) => inv.status = 'CLOSED');
                    }
                } catch (e: any) {
                    if (e.name === 'ContractFunctionExecutionError' || e.message?.includes('returned no data')) {
                        console.warn(`[Sync] Contract not found or invalid on agent page for ${agent.vaultAddress}. Skipping.`);
                    } else {
                        console.error("Withdraw sync failed on agent page:", e);
                    }
                }
            }

            // Calculation Logic:
            // totalDeposited should be the sum of ACTIVE principal in the database
            const activePrincipal = agentInvestments
                .filter((i: any) => i.status === 'ACTIVE')
                .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0);

            // netDeposits (historical for UX)
            const onChainDeposits = depositLogs.reduce((sum, log) => sum + (log.args.assets as bigint), 0n);
            const onChainWithdrawals = withdrawLogs.reduce((sum, log) => sum + (log.args.assets as bigint), 0n);
            const net = onChainDeposits > onChainWithdrawals ? onChainDeposits - onChainWithdrawals : 0n;

            setTotalDeposited(parseEther(activePrincipal.toFixed(18)));
            setNetDeposits(net);
        } catch (err) {
            console.error("Error fetching net deposits:", err);
        }
    }, [agent?.vaultAddress, publicClient, address, agent?.agentId]);

    useEffect(() => {
        fetchNetDeposits();
    }, [fetchNetDeposits]);

    if (loading) return (
        <div className="container pt-xxl flex justify-center">
            <ClawbotLoader message={`ESTABLISHING CLAWBOT LINK: AGENT_${id}`} />
        </div>
    );

    if (!agent) return (
        <div className="container pt-xxl text-center">
            <h1 className="text-error">Agent Out of Range</h1>
            <Link href="/clawdex" className="text-primary underline">Back to Registry</Link>
        </div>
    );

    async function executeDeposit() {
        if (!stakeAmount || !address || !agent?.vaultAddress) return;

        setStep('depositing');
        setErrorMsg(null);

        try {
            const parsedAmount = parseEther(stakeAmount);
            const hash = await writeContractAsync({
                address: agent.vaultAddress as `0x${string}`,
                abi: MolfiAgentVaultABI,
                functionName: "deposit",
                args: [parsedAmount, address],
            });

            setDepositTxHash(hash);
            setStep('waiting_deposit');
        } catch (err: any) {
            console.error("Deposit failed:", err);
            setErrorMsg(err.shortMessage || err.message || "Deposit failed");
            setStep('error');
        }
    };

    async function handleStake() {
        if (!isConnected) {
            alert("Please connect your wallet to stake.");
            return;
        }
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            alert("Please enter a valid amount to stake.");
            return;
        }

        if (!agent?.vaultAddress) {
            alert("This agent does not have a vault deployed yet.");
            return;
        }

        setStep('approving');
        setErrorMsg(null);

        try {
            const parsedAmount = parseEther(stakeAmount);

            // Check if approval is needed
            if (!allowance || (allowance as bigint) < parsedAmount) {
                const hash = await writeContractAsync({
                    address: USDC_ADDRESS,
                    abi: USDC_ABI,
                    functionName: "approve",
                    args: [agent.vaultAddress as `0x${string}`, parsedAmount],
                });

                setApproveTxHash(hash);
                setStep('waiting_approve');
            } else {
                await executeDeposit();
            }
        } catch (err: any) {
            console.error("Approval failed:", err);
            setErrorMsg(err.shortMessage || err.message || "Approval failed");
            setStep('error');
        }
    };

    async function handleWithdrawPnL() {
        if (!isConnected || !address || !agent?.vaultAddress) {
            alert("Please connect your wallet to withdraw.");
            return;
        }

        const maxWithdrawValue = (maxWithdraw as bigint | undefined) || 0n;
        const pnlAvailable = maxWithdrawValue > totalDeposited ? maxWithdrawValue - totalDeposited : 0n;

        if (pnlAvailable <= 0n) {
            alert("No PnL available to withdraw yet.");
            return;
        }

        setWithdrawStep('withdrawing');
        setWithdrawError(null);
        setIsFullWithdraw(false);

        try {
            const hash = await writeContractAsync({
                address: agent.vaultAddress as `0x${string}`,
                abi: MolfiAgentVaultABI,
                functionName: "withdraw",
                args: [pnlAvailable, address, address],
            });

            setWithdrawTxHash(hash);
            setWithdrawStep('waiting_withdraw');
        } catch (err: any) {
            console.error("Withdraw failed:", err);
            setWithdrawError(err.shortMessage || err.message || "Withdraw failed");
            setWithdrawStep('error');
        }
    }

    async function handleWithdrawAll() {
        if (!isConnected || !address || !agent?.vaultAddress) {
            alert("Please connect your wallet to withdraw.");
            return;
        }

        if (!shareBalance || (shareBalance as bigint) <= 0n) {
            alert("No shares to redeem.");
            return;
        }

        if (!confirm("Are you sure you want to CLOSE POSITION? \n\nThis will trigger a backend withdrawal where you receive ONLY the earned profit. Your principal will remain in the vault as protocol liquidity. Position will be marked CLOSED.")) {
            return;
        }

        setWithdrawStep('withdrawing');
        setWithdrawError(null);
        setIsFullWithdraw(true);

        try {
            // BACKEND EXECUTION: Call the Payout API
            const response = await fetch('/api/investments/close-with-profit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: address,
                    agentId: agent.agentId,
                    vaultAddress: agent.vaultAddress
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Backend payout failed');
            }

            console.log(`[Backend Payout] Success: ${data.txHash}`);
            setWithdrawTxHash(data.txHash);
            setWithdrawStep('success'); // Already confirmed by backend

            // REFRESH ALL STATE
            setTimeout(() => {
                refetchShareBalance();
                refetchMaxWithdraw();
                refetchAssetsFromShares();
                fetchNetDeposits();
            }, 2000);
        } catch (err: any) {
            console.error("Backend Redeem all failed:", err);
            setWithdrawError(err.message || "Redeem all failed");
            setWithdrawStep('error');
        }
    }

    const roiValue = Number(agent.roi || 0);
    const totalPnlValue = Number(agent.totalPnL || 0);
    const hasVault = !!agent.vaultAddress;
    const vaultExplorerUrl = hasVault ? getExplorerUrl(10143, agent.vaultAddress) : '#';
    const hasPnl = pnlAvailable > 0n;
    const hasShares = shareBalance && (shareBalance as bigint) > 0n;
    const canAllocate = step === 'idle' || step === 'success' || step === 'error';

    return (
        <>
            <style jsx global>{`
                .glass-card {
                    background: rgba(10, 10, 10, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(196, 33, 50, 0.15);
                }
                .glow-red {
                    box-shadow: 0 0 15px rgba(196, 33, 50, 0.3);
                }
                .pulse-red {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>

            <main className="max-w-[1536px] mx-auto px-4 py-8 mt-20 font-display text-white">
                <div className="glass-card rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center glow-red overflow-hidden border border-primary/20">
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`}
                                    alt={agent.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{agent.name}</h1>
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-red" />
                                        Active Circuit
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm max-w-md">
                                    {agent.description || `Autonomous agent optimizing for long-term alpha via ${agent.personality || 'Balanced'} execution strategies.`}
                                </p>
                                <p className="text-slate-500 text-xs mt-2 font-medium">
                                    CREATED {new Date(agent.created_at).toLocaleDateString()} • CONTRACT:{' '}
                                    <a
                                        href={vaultExplorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`transition-colors ${hasVault ? 'hover:text-primary' : 'pointer-events-none opacity-60'}`}
                                    >
                                        {shortenAddress(agent.vaultAddress || '')}
                                    </a>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Return</p>
                            <div className="flex flex-col items-end">
                                <span className={`text-4xl font-bold ${roiValue >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {roiValue >= 0 ? '+' : ''}{roiValue.toFixed(2)}%
                                </span>
                                <span className={`text-slate-300 font-medium ${totalPnlValue >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {totalPnlValue >= 0 ? '+' : ''}{totalPnlValue.toFixed(2)} USDT
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="glass-card p-5 rounded-xl border-l-4 border-l-primary/40">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Initial Capital</p>
                                <p className="text-2xl font-bold text-white">
                                    {Number(totalDepositedDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                    <span className="text-xs text-slate-400">USDT</span>
                                </p>
                                <p className="text-emerald-500 text-xs mt-1 font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                    {investorCount} investors
                                </p>
                            </div>
                            <div className="glass-card p-5 rounded-xl">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Current Value</p>
                                <p className="text-2xl font-bold text-white">
                                    {Number(currentAssetsDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                    <span className="text-xs text-slate-400">USDT</span>
                                </p>
                                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${roiValue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    <span className="material-symbols-outlined text-xs">
                                        {roiValue >= 0 ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                    {roiValue >= 0 ? '+' : ''}{roiValue.toFixed(2)}%
                                </p>
                            </div>
                            <div className="glass-card p-5 rounded-xl">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Vault State</p>
                                <p className={`text-2xl font-bold flex items-center gap-2 ${hasVault ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {hasVault ? 'Live' : 'Pending'}
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                </p>
                                <a
                                    href={vaultExplorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-slate-500 text-xs mt-1 truncate transition-colors block ${hasVault ? 'hover:text-primary cursor-pointer' : 'pointer-events-none opacity-60'}`}
                                >
                                    {shortenAddress(agent.vaultAddress || '')}
                                </a>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Return Over Time</h3>
                                    <p className="text-slate-500 text-xs">Aggregated performance of the {agent.name} circuit</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase">24H</button>
                                    <button className="px-3 py-1 rounded bg-white/5 text-slate-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">7D</button>
                                    <button className="px-3 py-1 rounded bg-white/5 text-slate-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">1M</button>
                                </div>
                            </div>
                            <div className="h-64 w-full relative">
                                {agent.equityCurve ? (
                                    <AgentPerformanceChart data={agent.equityCurve} height={240} />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-500">
                                        <div className="text-center">
                                            <Activity size={32} className="mx-auto mb-2 animate-pulse" />
                                            <p className="text-xs">Generating Performance Data...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                                    Live Agent Activity
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                {agent.activePositions && agent.activePositions.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">
                                            <tr>
                                                <th className="px-6 py-4">Position</th>
                                                <th className="px-6 py-4 text-right">Size</th>
                                                <th className="px-6 py-4 text-right">Leverage</th>
                                                <th className="px-6 py-4 text-right">Entry Price</th>
                                                <th className="px-6 py-4 text-right">Unrealized PnL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-medium divide-y divide-white/5">
                                            {agent.activePositions.map((pos: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pos.side === 'LONG'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-rose-500/10 text-rose-500'
                                                            }`}
                                                        >
                                                            {pos.side}
                                                        </span>
                                                        <span className="text-white">{pos.pair}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-300">
                                                        {parseFloat(pos.size).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-300">{pos.leverage}x</td>
                                                    <td className="px-6 py-4 text-right text-slate-300 font-mono">
                                                        {Number(pos.entryPrice || 0).toLocaleString()}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl} USDT
                                                        <div className="text-[10px] opacity-70">
                                                            ({pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent}%)
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Bot size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-slate-400 text-sm">Agent is currently analyzing market for entry...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Position History</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${posTab === 'active' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                        onClick={() => setPosTab('active')}
                                    >
                                        Active
                                    </button>
                                    <button
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${posTab === 'completed' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                        onClick={() => setPosTab('completed')}
                                    >
                                        History
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Asset</th>
                                            <th className="px-6 py-4">Side</th>
                                            <th className="px-6 py-4">{posTab === 'active' ? 'Leverage' : 'PnL'}</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4">{posTab === 'active' ? 'PnL (Unrealized)' : 'Exit Price'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium divide-y divide-white/5">
                                        {posTab === 'active' ? (
                                            <>
                                                {agent.activePositions?.map((pos: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 text-white">{pos.pair}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pos.side === 'LONG'
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : 'bg-rose-500/10 text-rose-500'
                                                                }`}
                                                            >
                                                                {pos.side}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-300">{pos.leverage || '10'}x</td>
                                                        <td className="px-6 py-4 text-slate-300">${Number(pos.size).toLocaleString()}</td>
                                                        <td className={`px-6 py-4 font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl} USDT
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!agent.activePositions || agent.activePositions.length === 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                                                            No active positions. Monitoring for high-precision entry.
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {agent.completedPositions?.map((pos: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 text-white">{pos.pair}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pos.side === 'LONG'
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : 'bg-rose-500/10 text-rose-500'
                                                                }`}
                                                            >
                                                                {pos.side}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 font-bold ${Number(pos.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {Number(pos.pnl || 0) >= 0 ? '+' : ''}{Number(pos.pnl || 0).toFixed(2)} USDT
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-300">${Number(pos.size).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-slate-400">{pos.exitPrice || '---'}</td>
                                                    </tr>
                                                ))}
                                                {(!agent.completedPositions || agent.completedPositions.length === 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                                                            No completed trades on record.
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card rounded-xl p-6 border-t-4 border-t-primary">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">settings_suggest</span>
                                Position Management
                            </h3>
                            {!isConnected ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-400">Connect your wallet to allocate and manage your position.</p>
                                    <ConnectButton />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                            <span>Amount (USDT)</span>
                                            <button
                                                className="text-primary hover:underline"
                                                onClick={() => setStakeAmount(formattedBalance)}
                                            >
                                                BAL: {parseFloat(formattedBalance).toLocaleString()}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                                            <span className="text-primary font-bold">$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="bg-transparent outline-none text-sm w-full"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                disabled={!canAllocate}
                                            />
                                            <button
                                                className="text-[10px] font-bold uppercase text-primary px-2 py-1 rounded bg-primary/10"
                                                onClick={() => setStakeAmount(formattedBalance)}
                                                disabled={!canAllocate}
                                            >
                                                Max
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded bg-white/[0.03] border border-white/5 text-[10px] text-slate-400 uppercase tracking-widest space-y-2">
                                        <div className="flex justify-between">
                                            <span>Principal</span>
                                            <span className="text-white">${Number(totalDepositedDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Current Value</span>
                                            <span className="text-white">${Number(currentAssetsDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PnL Available</span>
                                            <span className={`${Number(pnlAvailableDisplay) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {Number(pnlAvailableDisplay) >= 0 ? '+' : ''}${Number(pnlAvailableDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {hasVault ? (
                                        <>
                                            <button
                                                className={`w-full py-3 px-4 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-wider hover:bg-rose-700 transition-all glow-red ${!canAllocate ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                onClick={handleStake}
                                                disabled={!canAllocate}
                                            >
                                                {step === 'idle' && "Allocate capital"}
                                                {step === 'approving' && "Approve in wallet..."}
                                                {step === 'waiting_approve' && "Confirming approval..."}
                                                {step === 'depositing' && "Deposit in wallet..."}
                                                {step === 'waiting_deposit' && "Confirming deposit..."}
                                                {step === 'syncing' && "Syncing investment..."}
                                                {step === 'success' && "Success! Relay active"}
                                                {step === 'error' && "Failed - Retry?"}
                                            </button>

                                            <button
                                                className={`w-full py-3 px-4 rounded-lg border border-primary/20 bg-primary/5 text-primary text-sm font-bold uppercase tracking-wider hover:bg-primary/10 transition-all flex items-center justify-center gap-2 ${withdrawStep !== 'idle' || !hasPnl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={handleWithdrawPnL}
                                                disabled={withdrawStep !== 'idle' || !hasPnl}
                                            >
                                                {withdrawStep === 'idle' && (hasPnl ? "Withdraw Profits Only" : "No PnL Available")}
                                                {withdrawStep === 'withdrawing' && !isFullWithdraw && "Withdrawing..."}
                                                {withdrawStep === 'waiting_withdraw' && !isFullWithdraw && "Confirming..."}
                                                {withdrawStep === 'success' && !isFullWithdraw && "PnL Withdrawn"}
                                                {withdrawStep === 'error' && !isFullWithdraw && "Failed - Retry?"}
                                                <span className="material-symbols-outlined text-sm">lock</span>
                                            </button>

                                            <button
                                                className={`w-full py-3 px-4 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-wider hover:bg-rose-700 transition-all glow-red ${withdrawStep !== 'idle' || !hasShares ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={handleWithdrawAll}
                                                disabled={withdrawStep !== 'idle' || !hasShares}
                                            >
                                                {withdrawStep === 'idle' && "Close Position (Withdraw All)"}
                                                {withdrawStep === 'withdrawing' && isFullWithdraw && "Closing..."}
                                                {withdrawStep === 'waiting_withdraw' && isFullWithdraw && "Confirming..."}
                                                {withdrawStep === 'success' && isFullWithdraw && "Closed"}
                                                {withdrawStep === 'error' && isFullWithdraw && "Failed"}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-3 rounded bg-white/[0.03] border border-white/5 text-xs text-slate-400">
                                            Neural vault pending initialization.
                                        </div>
                                    )}

                                    {errorMsg && (
                                        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                                            ERROR: {errorMsg}
                                        </div>
                                    )}
                                    {withdrawError && (
                                        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                                            WITHDRAW ERROR: {withdrawError}
                                        </div>
                                    )}
                                    {withdrawStep === 'success' && withdrawTxHash && (
                                        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                                            Withdrawal confirmed: {shortenAddress(withdrawTxHash)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-300">neurology</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{agent.strategy || 'Neural Momentum'}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">v2.4 Circuit Strategy</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                {agent.description || 'Utilizes high-frequency sentiment analysis and order-flow heuristics to capture micro-momentum in volatile assets. Optimized for low-latency execution.'}
                            </p>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Win Rate</span>
                                    <span className="text-sm font-bold text-white font-mono">{Number(agent.winRate ?? 0)}%</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Trades</span>
                                    <span className="text-sm font-bold text-white font-mono">{Number(agent.totalTrades ?? 0)}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Agent PnL</span>
                                    <span className={`text-sm font-bold font-mono ${totalPnlValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {totalPnlValue >= 0 ? '+' : ''}{totalPnlValue.toFixed(2)} USDT
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/clawdex/agents"
                                className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                            >
                                View Full Agent Protocol
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">On-Chain Reputation</h4>
                                <span className="text-[10px] text-slate-500">Relay</span>
                            </div>
                            <div className="space-y-3 max-h-72 overflow-y-auto">
                                {reputationLogs.length > 0 ? (
                                    reputationLogs.map((log, i) => (
                                        <div key={i} className="p-3 rounded bg-white/[0.03] border border-white/5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-300 uppercase tracking-widest text-[10px]">
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                                <span className={`font-mono ${log.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {log.action === 'TRADE_CLOSE' ? (log.value >= 0 ? '+' : '') : ''}
                                                    {log.value.toFixed(log.value < 1 && log.value !== 0 ? 4 : 2)}
                                                    {log.action === 'DECISION' ? '%' : ' USDT'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                                                <span>{log.pair}</span>
                                                <span className="font-mono">#IX_{log.index}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-slate-500 py-6">
                                        Synchronizing reputation relay...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative rounded-xl p-6 overflow-hidden bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group cursor-pointer">
                            <div className="relative z-10">
                                <h4 className="text-white font-bold mb-1">Boost Your Yield</h4>
                                <p className="text-xs text-slate-300">Upgrade to Premium for lower execution fees and higher priority on agent trades.</p>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/5 group-hover:text-primary/10 transition-colors">diamond</span>
                        </div>
                    </div>
                </div>

            </main >
        </>
    );
}

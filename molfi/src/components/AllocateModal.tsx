"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
    X,
    Loader2,
    ArrowRight,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import MolfiAgentVaultABI from "@/abis/MolfiAgentVault.json";
import { decodeEventLog } from "viem";

// ABIs
const USDC_ABI = [
    { "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

const VAULT_ABI = [
    { "inputs": [{ "name": "assets", "type": "uint256" }, { "name": "receiver", "type": "address" }], "name": "deposit", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }
] as const;

interface AllocateModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: {
        name: string;
        vaultAddress: string;
        agentId: string;
        avatar?: string;
    };
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC as `0x${string}`;

type AllocateStep = 'idle' | 'approving' | 'waiting_approve' | 'depositing' | 'waiting_deposit' | 'syncing' | 'success' | 'error';

export default function AllocateModal({ isOpen, onClose, agent }: AllocateModalProps) {
    const { address, isConnected } = useAccount();
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState<AllocateStep>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
    const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>();

    // 1. Fetch mUSD.dev Balance
    const { data: usdcBalanceData } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    });

    const formattedBalance = usdcBalanceData ? formatEther(usdcBalanceData) : "0.00";

    // 2. Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: address && agent.vaultAddress ? [address, agent.vaultAddress as `0x${string}`] : undefined,
    });

    const { writeContractAsync } = useWriteContract();

    // 3. Wait for approve tx confirmation
    const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
        hash: approveTxHash,
    });

    // 4. Wait for deposit tx confirmation
    const { isSuccess: depositConfirmed, data: depositReceipt } = useWaitForTransactionReceipt({
        hash: depositTxHash,
    });

    // When approve is confirmed, proceed to deposit
    useEffect(() => {
        if (approveConfirmed && step === 'waiting_approve') {
            console.log("[AllocateModal] ✅ Approve confirmed, proceeding to deposit...");
            refetchAllowance();
            executeDeposit();
        }
    }, [approveConfirmed]);

    // When deposit is confirmed, sync with backend then show success
    useEffect(() => {
        if (depositConfirmed && step === 'waiting_deposit') {
            console.log("[AllocateModal] ✅ Deposit confirmed! Syncing with backend...");

            const syncInvestment = async () => {
                setStep('syncing');
                try {
                    let mintedShares = amount; // Fallback

                    if (depositReceipt) {
                        for (const log of depositReceipt.logs) {
                            try {
                                if (log.address.toLowerCase() === agent.vaultAddress.toLowerCase()) {
                                    const event = decodeEventLog({
                                        abi: MolfiAgentVaultABI,
                                        data: log.data,
                                        topics: log.topics,
                                    }) as any;

                                    if (event.eventName === 'Deposit') {
                                        if (event.args && event.args.shares) {
                                            mintedShares = formatEther(event.args.shares);
                                        }
                                    }
                                }
                            } catch (e) {
                                // Skip non-matching logs
                            }
                        }
                    }

                    console.log("[AllocateModal] Registering investment in DB...");
                    await fetch('/api/investments/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            txHash: depositTxHash,
                            agentId: agent.agentId,
                            userAddress: address,
                            amount: amount,
                            shares: mintedShares
                        })
                    });

                    console.log("[AllocateModal] ✅ Sync complete.");
                    setStep('success');
                } catch (err) {
                    console.error("[AllocateModal] ❌ Sync failed:", err);
                    // Still show success as the on-chain part worked, but log it
                    setStep('success');
                }
            };

            syncInvestment();
        }
    }, [depositConfirmed, depositReceipt]);

    const handleMax = () => {
        setAmount(formattedBalance);
    };

    const executeDeposit = async () => {
        if (!amount || !address) return;

        setStep('depositing');
        setErrorMsg(null);

        try {
            const parsedAmount = parseEther(amount);
            console.log("[AllocateModal] Depositing to vault:", agent.vaultAddress);
            console.log("[AllocateModal] Amount:", amount, "parsedAmount:", parsedAmount.toString());

            const hash = await writeContractAsync({
                address: agent.vaultAddress as `0x${string}`,
                abi: MolfiAgentVaultABI,
                functionName: "deposit",
                args: [parsedAmount, address],
            });

            console.log("[AllocateModal] Deposit tx submitted:", hash);
            setDepositTxHash(hash);
            setStep('waiting_deposit');
        } catch (err: any) {
            console.error("[AllocateModal] ❌ Deposit failed:", err);
            setErrorMsg(err.shortMessage || err.message || "Deposit failed");
            setStep('error');
        }
    };

    const handleAllocate = async () => {
        if (!amount || !address || !isConnected) return;

        setStep('approving');
        setErrorMsg(null);
        setApproveTxHash(undefined);
        setDepositTxHash(undefined);

        try {
            const parsedAmount = parseEther(amount);

            // Check if approval is needed
            if (!allowance || allowance < parsedAmount) {
                console.log("[AllocateModal] Approving mUSD.dev for vault:", agent.vaultAddress);
                console.log("[AllocateModal] Amount:", amount, "parsedAmount:", parsedAmount.toString());

                const hash = await writeContractAsync({
                    address: USDC_ADDRESS,
                    abi: USDC_ABI,
                    functionName: "approve",
                    args: [agent.vaultAddress as `0x${string}`, parsedAmount],
                });

                console.log("[AllocateModal] Approve tx submitted:", hash);
                setApproveTxHash(hash);
                setStep('waiting_approve');
                // The useEffect watching approveConfirmed will trigger executeDeposit
            } else {
                // Already approved, go straight to deposit
                console.log("[AllocateModal] Already approved, skipping to deposit");
                await executeDeposit();
            }
        } catch (err: any) {
            console.error("[AllocateModal] ❌ Approve failed:", err);
            setErrorMsg(err.shortMessage || err.message || "Approval failed");
            setStep('error');
        }
    };

    const handleClose = () => {
        setStep('idle');
        setErrorMsg(null);
        setApproveTxHash(undefined);
        setDepositTxHash(undefined);
        setAmount("");
        onClose();
    };

    const isProcessing = ['approving', 'waiting_approve', 'depositing', 'waiting_deposit'].includes(step);

    const getStepLabel = () => {
        switch (step) {
            case 'approving': return 'APPROVE IN WALLET...';
            case 'waiting_approve': return 'WAITING FOR APPROVAL CONFIRMATION...';
            case 'depositing': return 'DEPOSIT IN WALLET...';
            case 'waiting_deposit': return 'WAITING FOR DEPOSIT CONFIRMATION...';
            case 'syncing': return 'SYNCING WITH BACKEND...';
            case 'success': return 'ALLOCATION COMPLETE ✓';
            case 'error': return 'TRANSACTION FAILED';
            default: return 'CONFIRM ALLOCATION';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="allocate-overlay">
            <div className="allocate-modal float-anim">
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-md">
                        <div className="modal-agent-orb">
                            <img src={agent.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`} alt={agent.name} />
                        </div>
                        <div>
                            <h2 className="modal-title">ALLOCATE</h2>
                            <p className="modal-agent-name">{agent.name}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>


                <div className="input-section">
                    <div className="flex justify-between items-center mb-2">
                        <label className="input-label">Amount</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-dim font-bold uppercase cursor-pointer" onClick={handleMax}>
                                BAL: {Number(formattedBalance).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="premium-input-container">
                        <input
                            type="number"
                            placeholder="0.00"
                            className="amount-input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isProcessing}
                        />
                        <button className="max-chip" onClick={handleMax} disabled={isProcessing}>MAX</button>
                    </div>
                    <div className="mt-2 text-right">
                        <span className="text-[9px] text-primary font-bold uppercase cursor-pointer hover:underline" onClick={() => window.open('/faucet', '_blank')}>
                            Get test mUSD.dev
                        </span>
                    </div>
                </div>

                {/* Details List */}
                <div className="simple-details">
                    <div className="detail-row">
                        <span className="detail-label">Fee</span>
                        <span className="detail-value">0.05%</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Lock Duration</span>
                        <span className="detail-value">None</span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    className={`allocate-btn ${isProcessing ? 'loading' : ''} ${step === 'success' ? 'success' : ''} ${step === 'error' ? 'error-btn' : ''}`}
                    disabled={isProcessing || (!amount || Number(amount) <= 0) && step !== 'success'}
                    onClick={step === 'success' ? handleClose : handleAllocate}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{getStepLabel()}</span>
                        </>
                    ) : step === 'success' ? (
                        <>
                            <CheckCircle2 size={18} />
                            <span>{getStepLabel()}</span>
                        </>
                    ) : (
                        <>
                            CONFIRM <ArrowRight size={16} />
                        </>
                    )}
                </button>

                {/* Error Display */}
                {step === 'error' && errorMsg && (
                    <div className="error-display animate-in">
                        <AlertCircle size={14} />
                        <span>{errorMsg}</span>
                        <button className="retry-btn" onClick={handleAllocate}>RETRY</button>
                    </div>
                )}

                <p className="footer-warning">
                    Withdrawals available when neutral.
                </p>
            </div>

            <style jsx>{`
        .allocate-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(12px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .allocate-modal {
          background: #0a0a0c;
          border: 1px solid var(--glass-border);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.1);
          border-radius: 24px;
          width: 100%;
          max-width: 380px;
          padding: 1.5rem;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin: 0;
          line-height: 1;
        }

        .modal-agent-orb { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid var(--primary-purple); }
        .modal-agent-orb img { width: 100%; height: 100%; object-fit: cover; }
        .modal-agent-name { font-size: 10px; color: var(--primary-purple); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 2px 0 0 0; line-height: 1; }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          transition: 0.2s;
        }

        .close-btn:hover { color: white; }

        .input-section { margin-bottom: 1.25rem; }
        .input-label { font-size: 0.7rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }

        .premium-input-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: 0.3s;
        }

        .currency-symbol { font-size: 1.25rem; font-weight: 700; color: var(--text-dim); }

        .amount-input {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          width: 100%;
          outline: none;
          font-family: var(--font-mono);
        }

        .max-chip {
          background: var(--primary-purple);
          border: none;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }

        .max-chip:hover { transform: scale(1.05); opacity: 0.9; }

        .simple-details {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          margin-bottom: 1.5rem;
          padding: 0.5rem 1rem;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); }
        .detail-value { font-size: 0.8rem; font-weight: 700; color: white; }

        .allocate-btn {
          width: 100%;
          background: var(--primary-purple);
          border: none;
          border-radius: 12px;
          padding: 1rem;
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: var(--glow-purple);
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .allocate-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(168, 85, 247, 0.4);
        }

        .allocate-btn:disabled {
          background: #2a2a2c;
          color: #4a4a4c;
          cursor: not-allowed;
          box-shadow: none;
        }

        .allocate-btn.loading {
          background: rgba(168, 85, 247, 0.2);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: white;
          cursor: wait;
          box-shadow: none;
        }

        .allocate-btn.success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          box-shadow: none;
        }

        .allocate-btn.error-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          box-shadow: none;
        }

        .error-display {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #ef4444;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .retry-btn {
          margin-left: auto;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
        }

        .retry-btn:hover { background: rgba(239, 68, 68, 0.25); }

        .footer-warning {
          text-align: center;
          font-size: 0.6rem;
          color: var(--text-dim);
          font-weight: 500;
          margin-top: 1rem;
        }

        @keyframes floatModal {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .float-anim {
          animation: floatModal 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
      `}</style>
        </div>
    );
}

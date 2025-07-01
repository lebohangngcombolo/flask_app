import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import api from "../services/api";

type Beneficiary = {
  id: string;
  name: string;
  account: string;
  account_number: string;
  nickname: string;
};

interface Recipient {
  id: string;
  name: string;
  account_number: string;
  type: 'card' | 'beneficiary';
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  walletBalance: number;
  beneficiaries: Beneficiary[];
  onAddNewBeneficiary: () => void;
  cards: any[]; // Assuming cards is an array of objects
  recipients: Recipient[];
}

const FEE = 0.0; // Static fee for now

const TransferModal: React.FC<TransferModalProps> = ({
  open,
  onClose,
  walletBalance,
  beneficiaries,
  onAddNewBeneficiary,
  cards = [],
  recipients,
}) => {
  // Form state
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [manualAccountNumber, setManualAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setSelectedRecipientId("");
      setManualAccountNumber("");
      setAmount("");
      setNote("");
      setPin("");
      setIsSubmitting(false);
      setShowSummary(false);
      setErrors({});
    }
  }, [open]);

  // Find selected recipient
  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);

  // ADD THIS LINE:
  const recipientAccountNumber = selectedRecipient?.account_number || manualAccountNumber || '';

  // Validation
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedRecipientId && !manualAccountNumber) newErrors.recipient = "Select a recipient";
    if (!amount) newErrors.amount = "Enter an amount";
    else if (isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    else if (Number(amount) > walletBalance)
      newErrors.amount = "Amount exceeds wallet balance";
    setErrors(newErrors);
  }, [selectedRecipientId, manualAccountNumber, amount, walletBalance]);

  // Simulate API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Transfer successful!");
      onClose();
    }, 1200);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      const res = await api.post('/api/wallet/transfer', {
        amount: Number(amount),
        recipient_account_number: selectedRecipient ? selectedRecipient.account_number : manualAccountNumber,
        description: note,
      });
      // ...rest of your logic
    } catch (err) {
      // ...error handling
    } finally {
      setTransferLoading(false);
    }
  };

  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.2 } },
  };

  // Responsive max width
  const modalWidth = "max-w-lg w-full";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className={`bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 relative ${modalWidth} mx-2`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Transfer Funds</h2>
            <div className="mb-4 flex justify-between">
              <span className="text-gray-500">Wallet Balance:</span>
              <span className="font-semibold text-lg text-blue-700">ZAR {walletBalance.toFixed(2)}</span>
            </div>

            {/* Recipient Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <select
                className="input w-full"
                value={selectedRecipientId}
                onChange={e => setSelectedRecipientId(e.target.value)}
              >
                <option value="">Select a card or beneficiary...</option>
                {recipients.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.account_number}) {r.type === 'card' ? '[Card]' : ''}
                  </option>
                ))}
                <option value="manual">Other (enter account number)</option>
              </select>
              {selectedRecipientId === 'manual' && (
                <input
                  type="text"
                  className="input w-full mt-2"
                  value={manualAccountNumber}
                  onChange={e => setManualAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              )}
              {(selectedRecipient || manualAccountNumber) && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-center font-semibold">
                  {selectedRecipient
                    ? `${selectedRecipient.name} (${selectedRecipient.account_number})`
                    : manualAccountNumber
                      ? `Account: ${manualAccountNumber}`
                      : ''}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Amount (ZAR)</label>
              <input
                type="number"
                className="input w-full"
                min={1}
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Transfer Note <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                className="input w-full"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Stokvel contribution"
              />
            </div>

            {/* PIN */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Transfer PIN</label>
              <input
                type="password"
                className="input w-full"
                value={pin}
                onChange={e => setPin(e.target.value)}
                maxLength={4}
                placeholder="****"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              {showSummary ? (
                <form onSubmit={handleTransfer}>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={transferLoading}
                  >
                    {transferLoading ? "Processing..." : "Confirm Payment"}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (
                      !recipientAccountNumber ||
                      !amount ||
                      Number(amount) <= 0 ||
                      pin.length !== 4
                    ) {
                      return;
                    }
                    setShowSummary(true);
                  }}
                >
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={
                      isSubmitting ||
                      !recipientAccountNumber ||
                      !amount ||
                      Number(amount) <= 0 ||
                      pin.length !== 4
                    }
                  >
                    Next
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;

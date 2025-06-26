import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { X } from "lucide-react";

type Beneficiary = {
  id: string;
  name: string;
  account: string;
};

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  walletBalance: number;
  beneficiaries: Beneficiary[];
  onAddNewBeneficiary: () => void;
}

const FEE = 0.0; // Static fee for now

const TransferModal: React.FC<TransferModalProps> = ({
  open,
  onClose,
  walletBalance,
  beneficiaries,
  onAddNewBeneficiary,
}) => {
  // Form state
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setRecipientId("");
      setAmount("");
      setNote("");
      setPin("");
      setIsSubmitting(false);
      setShowSummary(false);
      setErrors({});
    }
  }, [open]);

  // Find selected recipient
  const recipient = beneficiaries.find((b) => b.id === recipientId);

  // Validation
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    if (!recipientId) newErrors.recipientId = "Select a recipient";
    if (!amount) newErrors.amount = "Enter an amount";
    else if (isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    else if (Number(amount) > walletBalance)
      newErrors.amount = "Amount exceeds wallet balance";
    setErrors(newErrors);
  }, [recipientId, amount, walletBalance]);

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
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Transfer Funds</h2>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm text-gray-500">Wallet Balance:</span>
              <span className="font-semibold text-lg text-blue-700">
                ZAR {walletBalance.toFixed(2)}
              </span>
            </div>
            {!showSummary ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowSummary(true); }}>
                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient</label>
                  <div className="flex gap-2">
                    <select
                      className="input flex-1"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      required
                    >
                      <option value="">Select beneficiary...</option>
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.account})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="text-blue-600 hover:underline text-sm font-medium"
                      onClick={onAddNewBeneficiary}
                    >
                      + Add New
                    </button>
                  </div>
                  {errors.recipientId && (
                    <div className="text-xs text-red-500 mt-1">{errors.recipientId}</div>
                  )}
                </div>
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <div className="text-xs text-red-500 mt-1">{errors.amount}</div>
                  )}
                </div>
                {/* Note */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transfer Note <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Stokvel contribution"
                    autoComplete="off"
                    name="transferNoteCustom"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
                {/* PIN/OTP input */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transfer PIN
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={4}
                    placeholder="****"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={
                      isSubmitting ||
                      !recipientId ||
                      !amount ||
                      !!errors.amount ||
                      !!errors.recipientId
                    }
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              // Transfer Summary
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="bg-gray-50 rounded-lg p-4 mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Recipient</span>
                    <span className="font-semibold">{recipient?.name || ""}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Amount</span>
                    <span>ZAR {Number(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Fee</span>
                    <span>ZAR {FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>ZAR {(Number(amount) + FEE).toFixed(2)}</span>
                  </div>
                  {note && (
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Note</span>
                      <span>{note}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                    onClick={() => setShowSummary(false)}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;

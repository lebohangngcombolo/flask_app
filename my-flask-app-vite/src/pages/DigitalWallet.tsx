import React, { useEffect, useState } from "react";
import {
  getWalletBalance,
  getTransactions,
  getCards,
  addCard,
  deleteCard,
  makeDeposit,
  makeTransfer,
  Card,
  Transaction,
} from "../services/walletService";
import { toast } from "react-toastify";
import { Plus, CreditCard, Send, Trash2, Loader2 } from "lucide-react";

const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Add this mapping for card icons (update paths as needed)
const cardTypeIcons: Record<string, string> = {
  visa: "/icons/visa.svg",
  mastercard: "/icons/mastercard.svg",
  amex: "/icons/amex.svg",
  unknown: "/icons/unknown.svg",
};

const DigitalWallet: React.FC = () => {
  // State
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("ZAR");
  const [loading, setLoading] = useState(true);

  // Cards
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Modals
  const [showDeposit, setShowDeposit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCard, setDepositCard] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Transfer form
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Card form
  const [cardForm, setCardForm] = useState({
    card_number: "",
    card_holder: "",
    expiry_date: "",
    cvv: "",
    card_type: "visa",
  });
  const [addCardLoading, setAddCardLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState({ totalDeposits: 0, totalTransfers: 0 });

  // Fetch wallet balance
  useEffect(() => {
    setLoading(true);
    getWalletBalance()
      .then((data) => {
        setBalance(data.balance);
        setCurrency(data.currency);
      })
      .catch(() => toast.error("Failed to load balance"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch cards
  useEffect(() => {
    setCardsLoading(true);
    getCards()
      .then(setCards)
      .catch(() => toast.error("Failed to load cards"))
      .finally(() => setCardsLoading(false));
  }, []);

  // Fetch transactions
  useEffect(() => {
    setTxLoading(true);
    getTransactions(page, 10)
      .then((data) => {
        setTransactions(data.transactions);
        setPages(data.pages);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setTxLoading(false));
  }, [page]);

  // Calculate summary
  useEffect(() => {
    const deposits = transactions.filter(tx => tx.transaction_type === "deposit" && tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transfers = transactions.filter(tx => tx.transaction_type === "transfer" && tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0);
    setSummary({ totalDeposits: deposits, totalTransfers: transfers });
  }, [transactions]);

  // Deposit handler
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    try {
      const res = await makeDeposit({
        amount: Number(depositAmount),
        card_id: Number(depositCard),
      });
      toast.success(res.message);
      setBalance(res.new_balance);
      setShowDeposit(false);
      setDepositAmount("");
      setDepositCard("");
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Deposit failed");
    } finally {
      setDepositLoading(false);
    }
  };

  // Transfer handler
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      const res = await makeTransfer({
        amount: Number(transferAmount),
        recipient_email: recipientEmail,
        description: transferDesc,
      });
      toast.success(res.message);
      setBalance(res.new_balance);
      setShowTransfer(false);
      setTransferAmount("");
      setRecipientEmail("");
      setTransferDesc("");
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  // Add card handler
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCardLoading(true);
    try {
      await addCard(cardForm);
      toast.success("Card added!");
      setShowAddCard(false);
      setCardForm({
        card_number: "",
        card_holder: "",
        expiry_date: "",
        cvv: "",
        card_type: "visa",
      });
      setCardsLoading(true);
      const res = await getCards();
      setCards(res);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add card");
    } finally {
      setAddCardLoading(false);
      setCardsLoading(false);
    }
  };

  // Delete card handler
  const handleDeleteCard = async (id: number) => {
    if (!window.confirm("Delete this card?")) return;
    try {
      await deleteCard(id);
      toast.success("Card deleted");
      setCards(cards.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete card");
    }
  };

  // Set default card (requires backend/service implementation)
  const handleSetDefaultCard = async (id: number) => {
    // await setDefaultCard(id);
    // toast.success("Default card set!");
    // setCards(cards.map(card => ({ ...card, is_default: card.id === id })));
    toast.info("Set default card functionality not yet implemented.");
  };

  // Find default card for deposit modal
  const defaultCardId = cards.find(card => card.is_default)?.id?.toString() || "";

  // UI
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background py-10 px-4 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Wallet Overview */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-100 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between transition-all">
          <div>
            <div className="text-gray-500 text-sm">Wallet Balance</div>
            <div className="text-4xl font-extrabold text-blue-700 tracking-tight">
              {loading ? <Spinner /> : `ZAR ${(balance ?? 0).toFixed(2)}`}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              <span>Total Deposits: ZAR {summary.totalDeposits.toFixed(2)}</span> |{" "}
              <span>Total Transfers: ZAR {summary.totalTransfers.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              className="btn-primary flex items-center gap-2 shadow hover:scale-105 transition"
              onClick={() => setShowDeposit(true)}
            >
              <Plus className="w-4 h-4" /> Deposit
            </button>
            <button
              className="btn-secondary flex items-center gap-2 shadow hover:scale-105 transition"
              onClick={() => setShowTransfer(true)}
            >
              <Send className="w-4 h-4" /> Transfer
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="backdrop-blur-md bg-white/70 border border-indigo-100 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold text-lg">
              My Cards <span className="text-xs text-gray-400">({cards.length})</span>
            </div>
            <button
              className="btn-outline flex items-center gap-2 hover:bg-indigo-50 transition"
              onClick={() => setShowAddCard(true)}
            >
              <CreditCard className="w-4 h-4" /> Add Card
            </button>
          </div>
          {cardsLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CreditCard className="w-10 h-10 mb-2" />
              <span>No cards added yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map(card => (
                <div key={card.id} className={`bg-gradient-to-r from-blue-200/80 to-indigo-200/80 rounded-xl p-4 flex justify-between items-center shadow hover:shadow-lg transition ${card.is_default ? "ring-2 ring-blue-500" : ""}`}>
                  <div className="flex items-center gap-2">
                    <img src={cardTypeIcons[card.card_type] || cardTypeIcons.unknown} alt={card.card_type} className="w-8 h-8" />
                    <div>
                      <div className="font-mono text-lg tracking-widest">
                        **** **** **** {card.card_number.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-500">{card.card_holder} | {card.expiry_date}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!card.is_default && (
                      <button
                        className="btn-outline text-xs px-2 py-1"
                        onClick={() => handleSetDefaultCard(card.id)}
                      >
                        Set as Default
                      </button>
                    )}
                    {card.is_default && (
                      <span className="text-blue-600 text-xs font-bold">Default</span>
                    )}
                    <button
                      className="text-red-500 hover:text-red-700 transition"
                      onClick={() => handleDeleteCard(card.id)}
                      aria-label="Delete card"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="backdrop-blur-md bg-white/70 border border-pink-100 rounded-2xl shadow-xl p-8">
          <div className="font-semibold text-lg mb-4">Recent Transactions</div>
          {txLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <Loader2 className="w-10 h-10 mb-2 animate-spin" />
              <span>No transactions yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Amount</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Reference</th>
                    <th className="px-2 py-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-blue-50/40 transition">
                      <td className="px-2 py-1">{tx.transaction_type}</td>
                      <td className={`px-2 py-1 font-mono ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </td>
                      <td className="px-2 py-1">{tx.status}</td>
                      <td className="px-2 py-1">{tx.reference}</td>
                      <td className="px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="flex justify-end mt-2 gap-2">
                <button
                  className="btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >Prev</button>
                <span className="text-gray-500">{page} / {pages}</span>
                <button
                  className="btn-outline"
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="modal" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-content">
            <form onSubmit={handleDeposit} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Deposit Funds</h2>
              <input
                type="number"
                min="1"
                required
                placeholder="Amount"
                className="input"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
              />
              <select
                required
                className="input"
                value={depositCard || defaultCardId}
                onChange={e => setDepositCard(e.target.value)}
              >
                <option value="">Select Card</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    **** **** **** {card.card_number.slice(-4)} ({card.card_holder}){card.is_default ? " (Default)" : ""}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => setShowDeposit(false)}
                  disabled={depositLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={depositLoading}
                >
                  {depositLoading && <Spinner />}
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="modal" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-content">
            <form onSubmit={handleTransfer} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Transfer Funds</h2>
              <input
                type="number"
                min="1"
                required
                placeholder="Amount"
                className="input"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
              />
              <input
                type="email"
                required
                placeholder="Recipient Email"
                className="input"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="input"
                value={transferDesc}
                onChange={e => setTransferDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => setShowTransfer(false)}
                  disabled={transferLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={transferLoading}
                >
                  {transferLoading && <Spinner />}
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-content">
            <form onSubmit={handleAddCard} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Add Card</h2>
              <input
                type="text"
                required
                placeholder="Card Number"
                className="input"
                value={cardForm.card_number}
                onChange={e => setCardForm(f => ({ ...f, card_number: e.target.value }))}
              />
              <input
                type="text"
                required
                placeholder="Card Holder"
                className="input"
                value={cardForm.card_holder}
                onChange={e => setCardForm(f => ({ ...f, card_holder: e.target.value }))}
              />
              <input
                type="text"
                required
                placeholder="Expiry Date (MM/YY)"
                className="input"
                value={cardForm.expiry_date}
                onChange={e => setCardForm(f => ({ ...f, expiry_date: e.target.value }))}
              />
              <input
                type="text"
                required
                placeholder="CVV"
                className="input"
                value={cardForm.cvv}
                onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value }))}
              />
              <select
                className="input"
                value={cardForm.card_type}
                onChange={e => setCardForm(f => ({ ...f, card_type: e.target.value }))}
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="unknown">Other</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => setShowAddCard(false)}
                  disabled={addCardLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={addCardLoading}
                >
                  {addCardLoading && <Spinner />}
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalWallet;

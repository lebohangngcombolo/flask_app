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
  updateCard,
} from "../services/walletService";
import { toast } from "react-toastify";
import { Plus, CreditCard, Send, Trash2, Loader2 } from "lucide-react";
import AddCardModal from "../components/AddCardModal";
import DepositModal from "../components/DepositModal";
import TransferModal from "../components/TransferModal";

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

const maskCardNumber = (num: string) => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return "•••• •••• •••• " + digits.slice(-4);
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

  // Transfer modal
  const [open, setOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0.0);

  // Example beneficiaries (replace with your real data or state)
  const beneficiaries = [
    { id: "1", name: "Ayanda M.", account: "1234567890" },
    { id: "2", name: "Bongiwe N.", account: "0987654321" },
  ];

  // Additional state for editing
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Additional state for deleting
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    setLoading(true);
    getWalletBalance()
      .then((data) => {
        setBalance(data.balance);
        setCurrency(data.currency);
        setWalletBalance(data.balance);
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
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setPages(data.pages || 1);
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
    if (!window.confirm("Are you sure you want to delete this card?")) return;
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

  // Additional handler for editing
  const handleEditCard = (card: Card) => setEditingCard(card);

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
              onClick={() => setOpen(true)}
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
                <div
                  key={card.id}
                  className="relative w-full max-w-sm mx-auto my-6 rounded-2xl shadow-xl overflow-hidden group transition-transform hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #23295A 60%, #3B4CCA 100%)",
                    minHeight: 180,
                    border: "1.5px solid #e0e7ff",
                  }}
                >
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      className="bg-white/80 hover:bg-blue-100 rounded-full p-2 shadow"
                      onClick={() => handleEditCard(card)}
                      title="Edit Card"
                    >
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" />
                      </svg>
                    </button>
                    <button
                      className="bg-white/80 hover:bg-red-100 rounded-full p-2 shadow"
                      onClick={() => setCardToDelete(card)}
                      title="Delete Card"
                    >
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* Card chip */}
                  <div className="absolute left-6 top-12 w-10 h-7 bg-yellow-400 rounded-md shadow-inner opacity-80"></div>
                  {/* Card details */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 text-white">
                    <div>
                      <span className="font-semibold text-lg tracking-wide block mb-2">{card.cardholder || card.card_holder}</span>
                      <span className="font-mono text-2xl tracking-widest select-none block mb-6 mt-8">
                        {maskCardNumber(card.card_number)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm tracking-wider">Exp: {card.expiry || card.expiry_date}</span>
                        {card.is_primary && (
                          <span className="bg-white/30 text-white px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow ml-2">
                            Primary
                          </span>
                        )}
                      </div>
                      <img
                        src={
                          (card.card_type || "").toLowerCase() === "mastercard"
                            ? "/icons/mastercard-svgrepo-com.svg"
                            : (card.card_type || "").toLowerCase() === "visa"
                            ? "/icons/visa-svgrepo-com.svg"
                            : "/icons/visa-svgrepo-com.svg"
                        }
                        alt="Card brand"
                        className="w-12 h-8 object-contain ml-2"
                        style={{ background: "rgba(255,255,255,0.15)", borderRadius: "0.5rem", padding: "0.25rem" }}
                      />
                    </div>
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
          ) : !transactions || transactions.length === 0 ? (
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

      <AddCardModal
        open={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSave={async (card) => {
          await addCard(card);
          toast.success("Card added!");
          setShowAddCard(false);
          setCards(await getCards());
        }}
      />

      <DepositModal
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        cards={cards.map(card => ({
          id: String(card.id),
          label: `${card.card_type?.toUpperCase() || "Card"} •••• ${card.card_number?.slice(-4)}`,
        }))}
        onDeposit={async (amount, method, note) => {
          await makeDeposit({ amount, card_id: Number(method) });
          toast.success("Deposit successful!");
          setShowDeposit(false);
          setBalance(await getWalletBalance());
        }}
      />

      {/* Transfer Modal */}
      <TransferModal
        open={open}
        onClose={() => setOpen(false)}
        walletBalance={walletBalance}
        beneficiaries={beneficiaries}
        onAddNewBeneficiary={() => alert("Add new beneficiary flow")}
      />

      {editingCard && (
        <AddCardModal
          open={!!editingCard}
          onClose={() => setEditingCard(null)}
          initialCard={editingCard}
          onSave={async (updatedCard) => {
            await updateCard(updatedCard);
            toast.success("Card updated!");
            setEditingCard(null);
            setCards(await getCards());
          }}
        />
      )}

      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h2 className="text-xl font-bold mb-2 text-red-600">Delete Card?</h2>
              <p className="text-gray-600 mb-4 text-center">
                Are you sure you want to delete this card ending in <b>{cardToDelete.card_number.slice(-4)}</b>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                  onClick={() => setCardToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold"
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await handleDeleteCard(cardToDelete.id);
                      setCardToDelete(null);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalWallet;

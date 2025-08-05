import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { CreditCard, Percent, Zap, Wifi, Smartphone } from "lucide-react";
import api from "../services/api";
import PurchaseReceipt from "../components/PurchaseReceipt";

const ITEM_TYPES = [
  { key: "airtime", label: "Airtime", icon: <Smartphone /> },
  { key: "data", label: "Data", icon: <Wifi /> },
  { key: "electricity", label: "Electricity", icon: <Zap /> },
  { key: "voucher", label: "Vouchers", icon: <Percent /> },
];

const PROVIDERS = {
  airtime: ["MTN", "Vodacom", "Cell C", "Telkom"],
  data: ["MTN", "Vodacom", "Cell C", "Telkom"],
  electricity: ["Eskom", "City Power"],
  voucher: ["Netflix", "Google Play", "Takealot"],
};

const MarketplacePurchase: React.FC = () => {
  const [itemType, setItemType] = useState("airtime");
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [purchaseData, setPurchaseData] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/market/transactions");
      setTransactions(res.data);
    } catch (err) {
      toast.error("Failed to load transactions");
    }
  };

  useEffect(() => {
    setProvider("");
    setPhoneNumber("");
    setMeterNumber("");
  }, [itemType]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!provider || !amount || Number(amount) <= 0) {
      toast.error("Please fill all fields with valid values.");
      return;
    }

    if (itemType === 'airtime' && !phoneNumber.trim()) {
      toast.error("Please enter a phone number for airtime purchase.");
      return;
    }

    if (itemType === 'data' && !phoneNumber.trim()) {
      toast.error("Please enter a phone number for data purchase.");
      return;
    }

    if (itemType === 'electricity' && !meterNumber.trim()) {
      toast.error("Please enter a meter number for electricity purchase.");
      return;
    }

    setLoading(true);
    try {
      const purchasePayload = {
        item_type: itemType,
        provider,
        amount: Number(amount),
        payment_method: paymentMethod,
        card_id: paymentMethod === "card" ? selectedCardId : undefined,
        phone_number: (itemType === 'airtime' || itemType === 'data') ? phoneNumber : undefined,
        meter_number: itemType === 'electricity' ? meterNumber : undefined,
      };

      const res = await api.post("/market/purchase", purchasePayload);
      
      // Generate mock token for non-airtime purchases
      const token = itemType !== 'airtime' ? generateToken() : undefined;
      
      const purchaseResult = {
        id: res.data.id || Date.now().toString(),
        itemType,
        provider,
        amount: Number(amount),
        phoneNumber: (itemType === 'airtime' || itemType === 'data') ? phoneNumber : undefined,
        token,
        reference: res.data.reference || generateReference(),
        status: 'successful' as const,
        timestamp: new Date().toISOString(),
        paymentMethod,
      };

      setPurchaseData(purchaseResult);
      setShowReceipt(true);
      
      toast.success(res.data.message || "Purchase successful!");
      fetchTransactions();
      
      // Reset form
      setAmount("");
      setProvider("");
      setPhoneNumber("");
      setMeterNumber("");
      
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateReference = () => {
    return 'TXN' + Date.now().toString().slice(-8);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Marketplace</h2>
        
        {/* Item Type Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          {ITEM_TYPES.map((type) => (
            <button
              key={type.key}
              className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition min-h-[120px] min-w-[120px] shadow-sm
                ${itemType === type.key
                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-400"
                }`}
              onClick={() => setItemType(type.key)}
              type="button"
            >
              <span className="mb-2">{React.cloneElement(type.icon, { className: "w-10 h-10" })}</span>
              <span className="text-base font-bold">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Purchase Form */}
        <form onSubmit={handlePurchase} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Provider <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              >
                <option value="">Select Provider</option>
                {PROVIDERS[itemType as keyof typeof PROVIDERS].map((prov: string) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Amount (R) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                required
              />
            </div>
          </div>

          {/* Phone Number for Airtime/Data */}
          {(itemType === 'airtime' || itemType === 'data') && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
          )}

          {/* Meter Number for Electricity */}
          {itemType === 'electricity' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Meter Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="Enter meter number"
                required
              />
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Payment Method <span className="text-red-600">*</span>
            </label>
            <div className="flex space-x-6 mt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                  className="text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Wallet</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="text-blue-600"
                />
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <CreditCard className="w-4 h-4 mr-1" />Card
                </span>
              </label>
            </div>
            
            {paymentMethod === "card" && (
              <div className="mt-3">
                <select
                  value={selectedCardId}
                  onChange={e => setSelectedCardId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Card</option>
                  <option value="1234567890123456">**** **** **** 1234</option>
                  <option value="9876543210987654">**** **** **** 9876</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg group"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              "Buy Now"
            )}
          </button>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">My Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 text-left text-gray-700 dark:text-gray-300">Item</th>
                <th className="py-3 text-left text-gray-700 dark:text-gray-300">Provider</th>
                <th className="py-3 text-left text-gray-700 dark:text-gray-300">Amount</th>
                <th className="py-3 text-left text-gray-700 dark:text-gray-300">Status</th>
                <th className="py-3 text-left text-gray-700 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {transactions.map((txn) => (
                <tr key={txn.reference} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-3 text-gray-900 dark:text-white">
                    {txn.item_type.charAt(0).toUpperCase() + txn.item_type.slice(1)}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-white">{txn.provider}</td>
                  <td className="py-3 text-gray-900 dark:text-white">R{txn.amount.toFixed(2)}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      txn.status === "successful"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : txn.status === "failed"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {new Date(txn.created_at || txn.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Receipt Modal */}
      {purchaseData && (
        <PurchaseReceipt
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          purchaseData={purchaseData}
        />
      )}
    </div>
  );
};

export default MarketplacePurchase;

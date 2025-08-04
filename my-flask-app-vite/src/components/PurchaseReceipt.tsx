import React, { useState } from 'react';
import { 
  CheckCircle, 
  Copy, 
  Download, 
  Share2, 
  Smartphone, 
  Wifi, 
  Zap, 
  Percent,
  Phone,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseData: {
    id: string;
    itemType: string;
    provider: string;
    amount: number;
    phoneNumber?: string;
    token?: string;
    reference: string;
    status: 'successful' | 'pending' | 'failed';
    timestamp: string;
    paymentMethod: string;
  };
}

const PurchaseReceipt: React.FC<PurchaseReceiptProps> = ({ isOpen, onClose, purchaseData }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'airtime':
        return <Smartphone className="w-6 h-6" />;
      case 'data':
        return <Wifi className="w-6 h-6" />;
      case 'electricity':
        return <Zap className="w-6 h-6" />;
      case 'voucher':
        return <Percent className="w-6 h-6" />;
      default:
        return <Smartphone className="w-6 h-6" />;
    }
  };

  const getItemLabel = (itemType: string) => {
    switch (itemType) {
      case 'airtime':
        return 'Airtime';
      case 'data':
        return 'Data Bundle';
      case 'electricity':
        return 'Electricity';
      case 'voucher':
        return 'Voucher';
      default:
        return itemType;
    }
  };

  const copyToClipboard = async (text: string, type: 'token' | 'reference') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${type === 'token' ? 'Token' : 'Reference'} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `
iStokvel Purchase Receipt
========================

Item: ${getItemLabel(purchaseData.itemType)}
Provider: ${purchaseData.provider}
Amount: R${purchaseData.amount.toFixed(2)}
${purchaseData.phoneNumber ? `Phone: ${purchaseData.phoneNumber}` : ''}
${purchaseData.token ? `Token: ${purchaseData.token}` : ''}
Reference: ${purchaseData.reference}
Status: ${purchaseData.status}
Date: ${new Date(purchaseData.timestamp).toLocaleString()}
Payment Method: ${purchaseData.paymentMethod}

Thank you for your purchase!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${purchaseData.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded!');
  };

  const shareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: 'iStokvel Purchase Receipt',
        text: `I just purchased ${getItemLabel(purchaseData.itemType)} from ${purchaseData.provider} for R${purchaseData.amount.toFixed(2)}`,
        url: window.location.href
      });
    } else {
      copyToClipboard(purchaseData.reference, 'reference');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Purchase Successful!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your transaction has been completed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          {/* Purchase Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              {getItemIcon(purchaseData.itemType)}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {getItemLabel(purchaseData.itemType)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {purchaseData.provider}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  R{purchaseData.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  purchaseData.status === 'successful'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : purchaseData.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {purchaseData.status.charAt(0).toUpperCase() + purchaseData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Token Section (for data, electricity, vouchers) */}
          {purchaseData.token && purchaseData.itemType !== 'airtime' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Hash className="w-4 h-4 mr-2" />
                  Token
                </h4>
                <button
                  onClick={() => copyToClipboard(purchaseData.token!, 'token')}
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <p className="font-mono text-lg text-center text-gray-900 dark:text-white break-all">
                  {purchaseData.token}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Use this token to redeem your {getItemLabel(purchaseData.itemType).toLowerCase()}
              </p>
            </div>
          )}

          {/* Phone Number (for airtime) */}
          {purchaseData.phoneNumber && purchaseData.itemType === 'airtime' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Recharged Number
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <p className="font-mono text-lg text-center text-gray-900 dark:text-white">
                  {purchaseData.phoneNumber}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Airtime has been credited to this number
              </p>
            </div>
          )}

          {/* Transaction Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Transaction Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Reference</span>
                <span className="font-mono text-gray-900 dark:text-white">{purchaseData.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date & Time</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(purchaseData.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {purchaseData.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={downloadReceipt}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={shareReceipt}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceipt; 
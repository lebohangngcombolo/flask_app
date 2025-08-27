import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';
import { PaystackPaymentComponent } from './paystack-payment';

type Tx = any;
type Card = any;

@Component({
  selector: 'app-digital-wallet',
  standalone: true,
  templateUrl: './digital-wallet.html',
  styleUrls: ['./digital-wallet.scss'],
  imports: [CommonModule, FormsModule, PaystackPaymentComponent]
})
export class DigitalWallet implements OnInit {
  // State
  balance = 0;
  loading = true;

  cards: Card[] = [];
  cardsLoading = false;

  transactions: Tx[] = [];
  txLoading = false;
  page = 1;
  pages = 1;

  // Modals
  showDeposit = false;
  showTransfer = false;
  showAddCard = false;
  showWithdraw = false;

  // Derived / misc
  walletBalance = 0;
  summary = { totalDeposits: 0, totalTransfers: 0, totalWithdrawals: 0 };

  // Edit/Delete
  editingCard: Card | null = null;
  cardToDelete: Card | null = null;
  deleting = false;

  // Account number
  accountNumber = '';
  copied = false;

  // Toast-ish messages
  infoMsg = '';
  errorMsg = '';

  // Modal form models
  deposit = { amount: 0, card_id: '', note: '' as string };
  transfer = { amount: 0, recipient_account_number: '', note: '' };
  withdraw = { amount: 0, bank_account_number: '', note: '' };

  // Add/Edit card form
  cardForm = { cardholder: '', cardNumber: '', expiry: '', cvv: '', primary: false };

  // Modals loading
  depositLoading = false;
  transferLoading = false;
  withdrawLoading = false;

  // Deposit modal fields
  depositMethod: string = ''; // 'bank' or card id

  // Computed helpers
  get depositAmountNum() { return Number(this.deposit.amount || 0); }
  get depositFee() { return this.depositAmountNum > 0 ? Math.max(2, this.depositAmountNum * 0.015) : 0; }
  get depositTotal() { return this.depositAmountNum + this.depositFee; }

  // Card helpers (format + validation)
  formatCardNumber(value: string) {
    const v = (value || '').replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  }
  formatExpiry(value: string) {
    let v = (value || '').replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  }
  get isCardNumberValid() { return /^\d{4} \d{4} \d{4} \d{4}$/.test(this.cardForm.cardNumber || ''); }
  get isExpiryValid() { return /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardForm.expiry || ''); }
  get isCvvValid() { return /^\d{3}$/.test(this.cardForm.cvv || ''); }
  get isCardholderValid() { return (this.cardForm.cardholder || '').trim().length > 2; }
  get isCardFormValid() { return this.isCardNumberValid && this.isExpiryValid && this.isCvvValid && this.isCardholderValid; }

  // Add new properties for Paystack
  showPaystackPayment = false;
  paystackAmount = 0;
  userEmail = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBalance();
    this.fetchCards();
    this.loadTransactions();
    this.loadAccountNumber();
  }

  clearMessages() { this.infoMsg = ''; this.errorMsg = ''; }

  async loadBalance() {
    this.loading = true;
    this.clearMessages();
    try {
      const data = await this.api.getWalletBalance().toPromise();
      const b = typeof data?.balance === 'number' ? data.balance : parseFloat(String(data?.balance || 0)) || 0;
      this.balance = b;
      this.walletBalance = b;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to load balance';
      this.balance = 0;
    } finally {
      this.loading = false;
    }
  }

  async fetchCards() {
    this.cardsLoading = true;
    this.clearMessages();
    try {
      const res = await this.api.getWalletCards().toPromise();
      this.cards = (res || []).map((c: any) => ({
        id: c.id,
        card_number: c.card_number,
        card_holder: c.cardholder,
        expiry_date: c.expiry,
        card_type: c.card_type,
        is_default: c.is_primary,
      }));
    } finally {
      this.cardsLoading = false;
    }
  }

  async loadTransactions() {
    this.txLoading = true;
    this.clearMessages();
    try {
      const data = await this.api.getWalletTransactions(this.page, 10).toPromise();
      this.transactions = Array.isArray(data?.transactions) ? data.transactions : [];
      this.pages = data?.pages || 1;
      this.recomputeSummary();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to load transactions';
      this.transactions = [];
      this.pages = 1;
    } finally {
      this.txLoading = false;
    }
  }

  async loadAccountNumber() {
    try {
      const prof = await this.api.getUserProfile().toPromise();
      this.accountNumber = prof?.account_number || 'Generating...';
      if (!prof?.account_number) {
        setTimeout(() => this.loadAccountNumber(), 1000);
      }
    } catch {
      this.accountNumber = 'Error loading';
    }
  }

  recomputeSummary() {
    const deposits = this.transactions
      .filter(tx => tx.transaction_type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const transfers = this.transactions
      .filter(tx => tx.transaction_type === 'transfer' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const withdrawals = this.transactions
      .filter(tx => tx.transaction_type === 'stokvel_contribution' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
    this.summary = { totalDeposits: deposits, totalTransfers: transfers, totalWithdrawals: withdrawals };
  }

  formatAmount(a: number) { return (Number(a) || 0).toFixed(2); }

  maskCardNumber(num: string) {
    if (!num) return '•••• •••• •••• ••••';
    const cleaned = String(num).replace(/\s/g, '');
    const last4 = cleaned.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }

  copyAccountNumber() {
    navigator.clipboard.writeText(this.accountNumber);
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }

  // Pagination
  async prevPage() { if (this.page > 1) { this.page--; await this.loadTransactions(); } }
  async nextPage() { if (this.page < this.pages) { this.page++; await this.loadTransactions(); } }

  // Deposit
  openAddCard() {
    this.cardForm = { cardholder: '', cardNumber: '', expiry: '', cvv: '', primary: false };
    this.editingCard = null;
    this.showAddCard = true;
  }

  openEditCard(card: any) {
    this.editingCard = card;
    this.cardForm = {
      cardholder: card.card_holder || '',
      cardNumber: this.formatCardNumber(card.card_number || ''),
      expiry: card.expiry_date || '',
      cvv: '',
      primary: !!card.is_default
    };
    this.showAddCard = true;
  }

  async saveCard() {
    this.clearMessages();
    if (!this.isCardFormValid) return;
    try {
      if (this.editingCard) {
        await this.api.updateWalletCard({
          id: this.editingCard.id,
          cardholder: this.cardForm.cardholder,
          cardNumber: this.cardForm.cardNumber,
          expiry: this.cardForm.expiry,
          cvv: this.cardForm.cvv,
          primary: this.cardForm.primary
        }).toPromise();
        this.infoMsg = 'Card updated!';
      } else {
        await this.api.addWalletCard({
          cardholder: this.cardForm.cardholder,
          cardNumber: this.cardForm.cardNumber,
          expiry: this.cardForm.expiry,
          cvv: this.cardForm.cvv,
          primary: this.cardForm.primary
        }).toPromise();
        this.infoMsg = 'Card added!';
      }
      this.showAddCard = false;
      await this.fetchCards();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Card save failed';
    }
  }

  askDeleteCard(card: Card) { this.cardToDelete = card; }
  async confirmDeleteCard() {
    if (!this.cardToDelete) return;
    this.deleting = true;
    this.clearMessages();
    try {
      await this.api.deleteWalletCard(this.cardToDelete.id).toPromise();
      this.infoMsg = 'Card deleted';
      this.cardToDelete = null;
      await this.fetchCards();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to delete card';
    } finally {
      this.deleting = false;
    }
  }

  async confirmDeposit() {
    this.clearMessages();
    if (this.depositAmountNum <= 0) { 
      this.errorMsg = 'Enter a valid amount'; 
      return; 
    }
    
    if (this.depositMethod === 'bank') {
      this.infoMsg = 'Use bank transfer with your wallet account number as reference.';
      this.showDeposit = false;
      return;
    }
    
    if (this.depositMethod === 'paystack') {
      // Show Paystack payment modal
      this.paystackAmount = this.depositAmountNum;
      this.userEmail = JSON.parse(localStorage.getItem('currentUser') || '{}').email || '';
      this.showPaystackPayment = true;
      this.showDeposit = false;
      return;
    }
    
    if (!this.deposit.card_id) { 
      this.errorMsg = 'Select a card'; 
      return; 
    }
    
    this.depositLoading = true;
    try {
      await this.api.makeDeposit({ 
        amount: this.depositAmountNum, 
        card_id: Number(this.deposit.card_id) 
      }).toPromise();
      this.infoMsg = 'Deposit successful!';
      this.showDeposit = false;
      await this.loadBalance();
      this.page = 1; 
      await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Deposit failed';
    } finally {
      this.depositLoading = false;
    }
  }

  // Handle Paystack payment success
  onPaystackSuccess(response: any) {
    console.log('Payment successful, closing modal and updating balance...');
    this.showPaystackPayment = false;
    this.infoMsg = 'Payment successful! Your wallet will be updated shortly.';
    
    // Auto-refresh balance and transactions after successful payment
    setTimeout(async () => {
      try {
        await this.loadBalance();
        this.page = 1;
        await this.loadTransactions();
        this.infoMsg = 'Payment processed! Your wallet has been updated.';
      } catch (error) {
        console.error('Error refreshing balance:', error);
        this.errorMsg = 'Payment successful but failed to refresh balance. Please refresh the page.';
      }
    }, 2000); // Wait 2 seconds for webhook to process
  }

  // Handle Paystack payment error
  onPaystackError(error: string) {
    console.log('Payment error:', error);
    this.showPaystackPayment = false;
    this.errorMsg = error;
  }

  // Handle Paystack payment cancellation
  onPaystackCancel() {
    console.log('Payment cancelled');
    this.showPaystackPayment = false;
  }

  // Transfer
  async confirmTransfer() {
    this.clearMessages();
    if (this.transfer.amount <= 0) { 
      this.errorMsg = 'Enter a valid amount'; 
      return; 
    }
    if (this.transfer.amount > this.walletBalance) { 
      this.errorMsg = 'Insufficient balance'; 
      return; 
    }
    if (!this.transfer.recipient_account_number) { 
      this.errorMsg = 'Enter recipient account number'; 
      return; 
    }
    
    this.transferLoading = true;
    try {
      await this.api.makeTransfer({
        amount: this.transfer.amount,
        recipient_account_number: this.transfer.recipient_account_number,
        description: this.transfer.note  // Changed from 'note' to 'description'
      }).toPromise();
      this.infoMsg = 'Transfer successful!';
      this.showTransfer = false;
      await this.loadBalance();
      this.page = 1;
      await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Transfer failed';
    } finally {
      this.transferLoading = false;
    }
  }

  // Withdraw
  async confirmWithdraw() {
    this.clearMessages();
    if (this.withdraw.amount <= 0) { 
      this.errorMsg = 'Enter a valid amount'; 
      return; 
    }
    if (this.withdraw.amount > this.walletBalance) { 
      this.errorMsg = 'Insufficient balance'; 
      return; 
    }
    if (!this.withdraw.bank_account_number) { 
      this.errorMsg = 'Enter bank account number'; 
      return; 
    }
    
    this.withdrawLoading = true;
    try {
      await this.api.withdraw({  // Changed from 'makeWithdrawal' to 'withdraw'
        amount: this.withdraw.amount,
        bank_account_number: this.withdraw.bank_account_number,
        note: this.withdraw.note
      }).toPromise();
      this.infoMsg = 'Withdrawal request submitted!';
      this.showWithdraw = false;
      await this.loadBalance();
      this.page = 1;
      await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Withdrawal failed';
    } finally {
      this.withdrawLoading = false;
    }
  }

  // Refresh after payment (for Paystack)
  async refreshAfterPayment() {
    this.clearMessages();
    this.infoMsg = 'Refreshing balance...';
    await this.loadBalance();
    this.page = 1;
    await this.loadTransactions();
    this.infoMsg = 'Balance updated!';
  }
}

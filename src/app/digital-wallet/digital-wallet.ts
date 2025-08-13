import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

type Tx = any;
type Card = any;

@Component({
  selector: 'app-digital-wallet',
  standalone: true,
  templateUrl: './digital-wallet.html',
  styleUrls: ['./digital-wallet.scss'],
  imports: [CommonModule, FormsModule]
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
  deposit = { amount: 0, card_id: '' };
  transfer = { amount: 0, recipient_account_number: '', note: '' };
  withdraw = { amount: 0, bank_account_number: '', note: '' };

  // Add/Edit card form
  cardForm = { cardholder: '', cardNumber: '', expiry: '', cvv: '', primary: false };

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
  async confirmDeposit() {
    this.clearMessages();
    try {
      await this.api.makeDeposit({ amount: Number(this.deposit.amount || 0), card_id: Number(this.deposit.card_id) }).toPromise();
      this.infoMsg = 'Deposit successful!';
      this.showDeposit = false;
      await this.loadBalance();
      this.page = 1; await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Deposit failed';
    }
  }

  // Transfer
  async confirmTransfer() {
    this.clearMessages();
    try {
      await this.api.makeTransfer({
        amount: Number(this.transfer.amount || 0),
        recipient_account_number: this.transfer.recipient_account_number,
        description: this.transfer.note
      }).toPromise();
      this.infoMsg = 'Transfer successful!';
      this.showTransfer = false;
      await this.loadBalance();
      this.page = 1; await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Transfer failed';
    }
  }

  // Withdraw
  async confirmWithdraw() {
    this.clearMessages();
    try {
      await this.api.withdraw({
        amount: Number(this.withdraw.amount || 0),
        bank_account_number: this.withdraw.bank_account_number,
        note: this.withdraw.note
      }).toPromise();
      this.infoMsg = 'Withdrawal successful!';
      this.showWithdraw = false;
      await this.loadBalance();
      this.page = 1; await this.loadTransactions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Withdrawal failed';
    }
  }

  // Cards
  openAddCard() {
    this.cardForm = { cardholder: '', cardNumber: '', expiry: '', cvv: '', primary: false };
    this.editingCard = null;
    this.showAddCard = true;
  }

  openEditCard(card: Card) {
    this.editingCard = card;
    this.cardForm = {
      cardholder: card.card_holder || '',
      cardNumber: card.card_number || '',
      expiry: card.expiry_date || '',
      cvv: '',
      primary: !!card.is_default
    };
    this.showAddCard = true;
  }

  async saveCard() {
    this.clearMessages();
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
}

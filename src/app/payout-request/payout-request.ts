import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api';

export interface SavedAccount {
  id: number;
  label: string;
  bank_name?: string;
  account_holder?: string;
  account_number: string;
  is_primary?: boolean;
}

@Component({
  selector: 'app-payout-request',
  templateUrl: './payout-request.html',
  styleUrls: ['./payout-request.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PayoutRequestComponent implements OnInit {
  step = 0;
  
  // Saved payout destinations
  accounts: SavedAccount[] = [];
  selectedAccountId: number | null = null;
  
  // Manual account entry
  useManual = false;
  bankName = '';
  accountHolder = '';
  accountNumber = '';
  branchCode = '';
  
  // Amount + Note
  amount: number | '' = '';
  note = '';
  
  // UX state
  loading = true;
  isSubmitting = false;
  error = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await this.fetchAccounts();
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      this.loading = false;
    }
  }

  private async fetchAccounts() {
    try {
      // Try to fetch saved payout accounts, fallback to wallet cards
      const res = await this.api.getWalletCards().toPromise();
      this.accounts = (res || []).map((c: any) => ({
        id: c.id,
        label: c.cardholder ? `${c.cardholder} •••• ${String(c.cardNumber).slice(-4)}` : `Card ${c.id}`,
        account_number: c.cardNumber || '',
        is_primary: c.primary,
      }));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      this.accounts = [];
    }
  }

  get selectedAccount(): SavedAccount | null {
    return this.accounts.find(a => a.id === this.selectedAccountId) || null;
  }

  get canGoNextFromStep0(): boolean {
    if (this.useManual) {
      return !!(this.accountNumber && this.accountHolder && this.bankName);
    }
    return !!this.selectedAccountId;
  }

  get canSubmit(): boolean {
    return this.getAmountAsNumber() > 0 && (this.useManual ? !!this.accountNumber : !!this.selectedAccount?.account_number);
  }

  // Helper method to convert amount to number
  getAmountAsNumber(): number {
    return typeof this.amount === 'number' ? this.amount : 0;
  }

  // Helper method to check if amount is valid
  isAmountValid(): boolean {
    return this.getAmountAsNumber() > 0;
  }

  async submit() {
    this.error = '';
    this.isSubmitting = true;
    
    try {
      const payload = {
        amount: this.getAmountAsNumber(),
        bank_account_number: this.useManual ? this.accountNumber : (this.selectedAccount?.account_number || ''),
        note: this.note || undefined,
      };
      
      await this.api.withdraw(payload).toPromise();
      this.step = 3; // Success step
    } catch (e: any) {
      this.error = e?.error?.message || e?.message || 'Failed to submit payout request.';
    } finally {
      this.isSubmitting = false;
    }
  }

  nextStep() {
    if (this.step === 0 && this.canGoNextFromStep0) {
      this.step = 1;
    } else if (this.step === 1 && this.isAmountValid()) {
      this.step = 2;
    }
  }

  prevStep() {
    if (this.step > 0) {
      this.step--;
    }
  }

  resetForm() {
    this.step = 0;
    this.selectedAccountId = null;
    this.useManual = false;
    this.bankName = '';
    this.accountHolder = '';
    this.accountNumber = '';
    this.branchCode = '';
    this.amount = '';
    this.note = '';
    this.error = '';
  }
}

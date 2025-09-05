import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api';

interface Transaction {
  id: string;
  contributor: string;
  group: string;
  group_id: string;
  payment_method: string;
  card_number_last4?: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filtered: Transaction[] = [];
  search = "";
  selectedAccount = "all";
  dateRange = "6m";
  selectedGroup = "all";
  groupNames: string[] = [];
  loading = true;
  error: string | null = null;

  // Move dateRanges inside the component class
  dateRanges = [
    { label: "Last 6 months", value: "6m" },
    { label: "Last 3 months", value: "3m" },
    { label: "Last month", value: "1m" },
    { label: "This year", value: "ytd" },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.fetchTransactions();
    this.fetchGroupNames();
  }

  async fetchTransactions(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      
      const response = await this.api.getAdminContributions().toPromise();
      
      if (response && Array.isArray(response)) {
        this.transactions = response;
        this.filtered = response;
      } else {
        this.transactions = [];
        this.filtered = [];
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      this.error = error.message || 'Failed to fetch transactions from database';
      this.transactions = [];
      this.filtered = [];
    } finally {
      this.loading = false;
    }
  }

  async fetchGroupNames(): Promise<void> {
    try {
      const response = await this.api.getAdminGroupNames().toPromise();
      if (response && Array.isArray(response)) {
        this.groupNames = response;
      }
    } catch (error) {
      console.error('Error fetching group names:', error);
    }
  }

  onSearchChange(): void {
    this.filterTransactions();
  }

  onFilterChange(): void {
    this.filterTransactions();
  }

  private filterTransactions(): void {
    this.filtered = this.transactions.filter(
      (t) =>
        (this.selectedGroup === "all" || t.group === this.selectedGroup) &&
        (this.selectedAccount === "all" || t.payment_method === this.selectedAccount) &&
        (this.search === "" ||
          t.contributor.toLowerCase().includes(this.search.toLowerCase()) ||
          t.group.toLowerCase().includes(this.search.toLowerCase()) ||
          t.reference.toLowerCase().includes(this.search.toLowerCase()))
    );
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  }

  formatAmount(amount: number): string {
    return `R ${amount.toLocaleString()}`;
  }

  getPaymentMethodDisplay(transaction: Transaction): string {
    if (transaction.payment_method === 'wallet') {
      return 'Wallet';
    } else if (transaction.card_number_last4) {
      return `Bank Card ****${transaction.card_number_last4}`;
    } else {
      return 'Bank';
    }
  }
}

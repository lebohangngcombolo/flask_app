import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

interface AnalyticsData {
  user_stats?: {
    total: number;
    verified: number;
    recent_last_7_days: number;
  };
  sessions?: {
    total: number;
    active: number;
  };
  transactions?: {
    total: number;
    completed: number;
    volume: number;
    daily_volume: Array<{ date: string; amount: number }>;
    volume_by_type: { [key: string]: number };
  };
  contributions?: {
    total: number;
    volume: number;
  };
  referrals?: {
    total: number;
    completed: number;
  };
  chat?: {
    total_messages: number;
    user: number;
    assistant: number;
  };
  notifications?: {
    unread: number;
  };
  top_stokvel_groups?: Array<{ name: string; members: number }>;
}

interface SummaryCard {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.html',
  styleUrls: ['./admin-analytics.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminAnalyticsComponent implements OnInit {
  data: AnalyticsData | null = null;
  loading = true;
  filters = {
    start_date: '',
    end_date: '',
    user_id: '',
    group_id: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.api.getAnalyticsOverview(this.filters).toPromise();
      this.data = response;
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // You can add toast notification here if you have it set up
    } finally {
      this.loading = false;
    }
  }

  onFilterSubmit(): void {
    this.loadAnalytics();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filters = { ...this.filters, [target.name]: target.value };
  }

  getSummaryCardData(): SummaryCard[] {
    if (!this.data) return [];
    
    return [
      { label: "Total Users", value: this.data.user_stats?.total ?? '-' },
      { label: "Verified Users", value: this.data.user_stats?.verified ?? '-' },
      { label: "New Users (7d)", value: this.data.user_stats?.recent_last_7_days ?? '-' },
      { label: "Active Sessions", value: this.data.sessions?.active ?? '-' },
      { label: "Total Transactions", value: this.data.transactions?.total ?? '-' },
      { label: "Completed Transactions", value: this.data.transactions?.completed ?? '-' },
      { label: "Total Volume", value: this.data.transactions?.volume ? `R${this.data.transactions.volume.toLocaleString()}` : '-' },
      { label: "Total Contributions", value: this.data.contributions?.total ?? '-' },
    ];
  }

  getTransactionVolumeByType(): Array<{ type: string; amount: number }> {
    if (!this.data?.transactions?.volume_by_type) return [];
    return Object.entries(this.data.transactions.volume_by_type).map(([type, amount]) => ({ type, amount }));
  }

  getReferralData(): Array<{ name: string; value: number }> {
    if (!this.data?.referrals) return [];
    return [
      { name: 'Completed', value: this.data.referrals.completed },
      { name: 'Pending', value: this.data.referrals.total - this.data.referrals.completed }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}

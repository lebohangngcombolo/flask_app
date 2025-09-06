import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PayoutRequest } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  templateUrl: './admin-payouts.html',
  styleUrls: ['./admin-payouts.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminPayoutsComponent implements OnInit {
  requests: PayoutRequest[] = [];
  loading = true;
  selected: PayoutRequest | null = null;
  actionLoading = false;
  showRejectModal = false;
  rejectReason = '';
  search = '';
  statusFilter = 'all';

  statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  async fetchRequests() {
    this.loading = true;
    try {
      this.requests = await firstValueFrom(this.apiService.getPayoutRequests());
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      this.requests = [];
    } finally {
      this.loading = false;
    }
  }

  async handleApprove(id: number) {
    this.actionLoading = true;
    try {
      await firstValueFrom(this.apiService.approvePayoutRequest(id));
      this.fetchRequests();
      this.selected = null;
    } catch (error) {
      console.error('Error approving payout request:', error);
    } finally {
      this.actionLoading = false;
    }
  }

  async handleReject(id: number, reason: string) {
    this.actionLoading = true;
    try {
      await firstValueFrom(this.apiService.rejectPayoutRequest(id, reason));
      this.fetchRequests();
      this.selected = null;
      this.showRejectModal = false;
      this.rejectReason = '';
    } catch (error) {
      console.error('Error rejecting payout request:', error);
    } finally {
      this.actionLoading = false;
    }
  }

  get filteredRequests() {
    return this.requests.filter(r => {
      const matchesSearch =
        (r.user_name || '').toLowerCase().includes(this.search.toLowerCase()) ||
        (r.user_email || '').toLowerCase().includes(this.search.toLowerCase()) ||
        (r.group_name || '').toLowerCase().includes(this.search.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || r.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  formatCurrency(amount: number): string {
    return `R${amount.toLocaleString()}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  capitalizeStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  openRejectModal() {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  canReject(): boolean {
    return !this.actionLoading && this.rejectReason.trim().length > 0;
  }
}

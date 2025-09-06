import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CustomerConcern, ConcernsResponse } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-concerns-management',
  standalone: true,
  templateUrl: './concerns-management.html',
  styleUrls: ['./concerns-management.scss'],
  imports: [CommonModule, FormsModule]
})
export class ConcernsManagement implements OnInit {
  concerns: CustomerConcern[] = [];
  loading = false;
  error: string | null = null;
  search = '';
  status = '';
  page = 1;
  limit = 20;
  total = 0;
  selectedConcern: CustomerConcern | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchConcerns();
  }

  async fetchConcerns() {
    this.loading = true;
    this.error = null;
    try {
      const response: ConcernsResponse = await firstValueFrom(
        this.api.getAdminConcerns(this.page, this.limit, this.status, this.search)
      );
      this.concerns = response.concerns;
      this.total = response.total;
    } catch (e: any) {
      this.error = e?.message || 'Failed to fetch concerns';
    } finally {
      this.loading = false;
    }
  }

  onSearchChange() {
    this.page = 1; // Reset to first page when searching
    this.fetchConcerns();
  }

  onStatusChange() {
    this.page = 1; // Reset to first page when filtering
    this.fetchConcerns();
  }

  onStatusSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target && this.selectedConcern) {
      this.handleStatusChange(this.selectedConcern, target.value);
    }
  }

  async handleStatusChange(concern: CustomerConcern, newStatus: string) {
    try {
      await firstValueFrom(this.api.updateConcernStatus(concern.id, newStatus));
      // Update local state
      this.concerns = this.concerns.map(c =>
        c.id === concern.id ? { ...c, status: newStatus as any } : c
      );
      if (this.selectedConcern && this.selectedConcern.id === concern.id) {
        this.selectedConcern = { ...this.selectedConcern, status: newStatus as any };
      }
    } catch (e: any) {
      this.error = e?.message || 'Failed to update status';
    }
  }

  async handleDelete(concern: CustomerConcern) {
    if (!confirm(`Are you sure you want to delete this concern from ${concern.name}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deleteConcern(concern.id));
      this.concerns = this.concerns.filter(c => c.id !== concern.id);
      this.total--;
      if (this.selectedConcern && this.selectedConcern.id === concern.id) {
        this.selectedConcern = null;
      }
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete concern';
    }
  }

  openConcernModal(concern: CustomerConcern) {
    this.selectedConcern = concern;
  }

  closeConcernModal() {
    this.selectedConcern = null;
  }

  goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= this.getTotalPages()) {
      this.page = newPage;
      this.fetchConcerns();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'closed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusText(status: string) {
    switch (status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'closed': return 'Closed';
      default: return status;
    }
  }
}

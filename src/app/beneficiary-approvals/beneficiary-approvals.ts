import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Beneficiary } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-beneficiary-approvals',
  standalone: true,
  templateUrl: './beneficiary-approvals.html',
  styleUrls: ['./beneficiary-approvals.scss'],
  imports: [CommonModule, FormsModule]
})
export class BeneficiaryApprovals implements OnInit {
  beneficiaries: Beneficiary[] = [];
  loading = true;
  error: string | null = null;
  search = '';
  statusFilter = '';
  selectedBeneficiary: Beneficiary | null = null;
  docPreview: { url: string; label: string } | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    console.log('BeneficiaryApprovals component initialized');
    this.fetchBeneficiaries();
  }

  async fetchBeneficiaries() {
    console.log('Fetching beneficiaries...');
    this.loading = true;
    this.error = null;
    try {
      const result = await firstValueFrom(this.api.getAdminBeneficiaries());
      console.log('Beneficiaries fetched:', result);
      this.beneficiaries = result;
    } catch (e: any) {
      console.error('Error fetching beneficiaries:', e);
      this.error = e?.message || 'Failed to fetch beneficiaries';
    } finally {
      this.loading = false;
      console.log('Loading completed. Beneficiaries count:', this.beneficiaries.length);
    }
  }

  get filteredBeneficiaries() {
    const filtered = this.beneficiaries.filter(b =>
      (b.name?.toLowerCase().includes(this.search.toLowerCase()) ||
       b.id_number?.toLowerCase().includes(this.search.toLowerCase()) ||
       b.email?.toLowerCase().includes(this.search.toLowerCase())) &&
      (!this.statusFilter || b.status === this.statusFilter)
    );
    console.log('Filtered beneficiaries:', filtered.length);
    return filtered;
  }

  async handleApprove() {
    if (!this.selectedBeneficiary) return;
    try {
      await firstValueFrom(this.api.approveBeneficiary(this.selectedBeneficiary.id));
      // Update status in local state
      this.beneficiaries = this.beneficiaries.map(b =>
        b.id === this.selectedBeneficiary!.id ? { ...b, status: 'Approved' } : b
      );
      this.selectedBeneficiary = null;
    } catch (e: any) {
      this.error = e?.message || 'Failed to approve beneficiary';
    }
  }

  async handleReject() {
    if (!this.selectedBeneficiary) return;
    try {
      await firstValueFrom(this.api.rejectBeneficiary(this.selectedBeneficiary.id));
      // Update status in local state
      this.beneficiaries = this.beneficiaries.map(b =>
        b.id === this.selectedBeneficiary!.id ? { ...b, status: 'Rejected' } : b
      );
      this.selectedBeneficiary = null;
    } catch (e: any) {
      this.error = e?.message || 'Failed to reject beneficiary';
    }
  }

  getStatusColor(status: string | undefined) {
    switch (status) {
      case 'Approved': return 'text-green-600 font-semibold';
      case 'Rejected': return 'text-red-500 font-semibold';
      case 'No Documents': return 'text-gray-400 font-semibold';
      default: return 'text-yellow-600 font-semibold';
    }
  }

  getStatusText(status: string | undefined, beneficiary: Beneficiary) {
    if (status === 'Approved') return 'Approved';
    if (status === 'Rejected') return 'Rejected';
    if (!beneficiary.id_doc_url && !beneficiary.address_doc_url && !beneficiary.relationship_doc_url) {
      return 'No Documents';
    }
    return 'Pending';
  }

  previewDocument(url: string, label: string) {
    this.docPreview = { url, label };
  }

  closeDocPreview() {
    this.docPreview = null;
  }
}

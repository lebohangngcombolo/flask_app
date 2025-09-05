import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

interface KYCSubmission {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  employment_status: string;
  bank_name: string;
  account_number: string;
  id_document_path: string;
  proof_of_address_path: string;
  proof_of_income_path: string;
  bank_statement_path: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

@Component({
  selector: 'app-kyc-management',
  templateUrl: './kyc-management.html',
  styleUrls: ['./kyc-management.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class KYCManagementComponent implements OnInit {
  submissions: KYCSubmission[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = 'all';
  selectedSubmission: KYCSubmission | null = null;
  previewUrl: string | null = null;
  previewType: 'image' | 'pdf' | null = null;
  actionLoading = false;
  adminNotes = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.fetchSubmissions();
  }

  async fetchSubmissions(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.api.getKYCSubmissions().toPromise();
      this.submissions = response || [];
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    } finally {
      this.loading = false;
    }
  }

  async handleApprove(submissionId: number): Promise<void> {
    try {
      this.actionLoading = true;
      await this.api.approveKYCSubmission(submissionId).toPromise();
      await this.fetchSubmissions();
      this.selectedSubmission = null;
    } catch (error) {
      console.error('Failed to approve submission:', error);
      alert('Failed to approve submission. Please try again.');
    } finally {
      this.actionLoading = false;
    }
  }

  async handleReject(submissionId: number): Promise<void> {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      this.actionLoading = true;
      await this.api.rejectKYCSubmission(submissionId, reason).toPromise();
      await this.fetchSubmissions();
      this.selectedSubmission = null;
    } catch (error) {
      console.error('Failed to reject submission:', error);
      alert('Failed to reject submission. Please try again.');
    } finally {
      this.actionLoading = false;
    }
  }

  showComingSoonAlert(): void {
    alert('Feature coming soon: Request more info from user!');
  }

  get filteredSubmissions(): KYCSubmission[] {
    return this.submissions.filter(submission => {
      const matchesSearch = 
        (submission.full_name || submission.user_name || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (submission.email || submission.user_email || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (submission.phone || '').includes(this.searchTerm) ||
        (submission.id_number || '').includes(this.searchTerm);
      const matchesStatus = this.statusFilter === 'all' || submission.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get pendingCount(): number {
    return this.submissions.filter(s => s.status === 'pending').length;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'approved':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'rejected':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIconColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  getDocUrl(docPath: string | null): string | null {
    if (!docPath) return null;
    if (docPath.includes('kyc_docs/')) {
      const filename = docPath.split('kyc_docs/').pop();
      return `/uploads/kyc_docs/${filename}`;
    }
    if (docPath.startsWith('/')) {
      return docPath;
    }
    return `/${docPath}`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getDocsCount(submission: KYCSubmission): number {
    return [
      submission.id_document_path,
      submission.proof_of_address_path,
      submission.proof_of_income_path,
      submission.bank_statement_path,
    ].filter(Boolean).length;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  closeModal(): void {
    this.selectedSubmission = null;
    this.previewUrl = null;
    this.previewType = null;
    this.adminNotes = '';
  }

  openPreview(url: string, type: 'image' | 'pdf'): void {
    this.previewUrl = url;
    this.previewType = type;
  }

  closePreview(): void {
    this.previewUrl = null;
    this.previewType = null;
  }

  isImageFile(url: string): boolean {
    return /\.(jpg|jpeg|png)$/i.test(url);
  }

  isPdfFile(url: string): boolean {
    return /\.pdf$/i.test(url);
  }
}

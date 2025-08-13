import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Beneficiary, BeneficiaryForm } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  templateUrl: './beneficiaries.html',
  styleUrls: ['./beneficiaries.scss'],
  imports: [CommonModule, FormsModule]
})
export class Beneficiaries implements OnInit {
  beneficiaries: Beneficiary[] = [];
  loading = true;
  showForm = false;
  editing: Beneficiary | null = null;
  confirmDelete: Beneficiary | null = null;
  search = '';
  selectedBeneficiary: Beneficiary | null = null;
  previewDoc: { url: string; type: string; label: string } | null = null;

  // Form state
  form: BeneficiaryForm = {
    name: '',
    id_number: '',
    relationship: '',
    date_of_birth: '',
    phone: '',
    email: ''
  };
  formLoading = false;

  // Document uploads
  idFile: File | null = null;
  addressFile: File | null = null;
  relationshipFile: File | null = null;

  relationships = [
    { label: 'Spouse', color: 'bg-pink-100 text-pink-700' },
    { label: 'Child', color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Parent', color: 'bg-green-100 text-green-700' },
    { label: 'Sibling', color: 'bg-blue-100 text-blue-700' },
    { label: 'Friend', color: 'bg-purple-100 text-purple-700' },
    { label: 'Other', color: 'bg-gray-100 text-gray-700' }
  ];

  docTypes = [
    { key: 'id_doc_url', label: 'ID Document', icon: '🪪' },
    { key: 'address_doc_url', label: 'Proof of Address', icon: '🏠' },
    { key: 'relationship_doc_url', label: 'Proof of Relationship', icon: '👪' }
  ];

  infoMsg = '';
  errorMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchBeneficiaries();
  }

  clearMessages() {
    this.infoMsg = '';
    this.errorMsg = '';
  }

  // Helper method to safely access document properties
  getDocumentUrl(beneficiary: Beneficiary, key: string): string | undefined {
    return beneficiary[key as keyof Beneficiary] as string | undefined;
  }

  async fetchBeneficiaries() {
    this.loading = true;
    this.clearMessages();
    try {
      const data = await firstValueFrom(this.api.getBeneficiaries());
      this.beneficiaries = Array.isArray(data) ? data : [];
    } catch (e: any) {
      this.errorMsg = e?.message || 'Could not load beneficiaries.';
    } finally {
      this.loading = false;
    }
  }

  getInitials(name = '') {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getRelationshipColor(relationship: string) {
    const found = this.relationships.find(r => r.label === relationship);
    return found ? found.color : 'bg-gray-100 text-gray-700';
  }

  getFileType(url: string) {
    if (!url) return '';
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.match(/\.(jpeg|jpg|png|gif|png)$/i)) return 'image';
    return '';
  }

  get filteredBeneficiaries() {
    return this.beneficiaries.filter(b =>
      b.name?.toLowerCase().includes(this.search.toLowerCase()) ||
      b.id_number?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  openForm(beneficiary?: Beneficiary) {
    this.editing = beneficiary || null;
    this.form = beneficiary ? { ...beneficiary } : {
      name: '', id_number: '', relationship: '', date_of_birth: '', phone: '', email: ''
    };
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editing = null;
    this.fetchBeneficiaries();
  }

  getDOBFromID(idNumber: string) {
    if (!/^\d{6}/.test(idNumber)) return '';
    const year = idNumber.slice(0, 2);
    const month = idNumber.slice(2, 4);
    const day = idNumber.slice(4, 6);
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = parseInt(year, 10) > currentYear ? '19' + year : '20' + year;
    return `${fullYear}-${month}-${day}`;
  }

  onFormChange(field: keyof BeneficiaryForm, value: string) {
    this.form[field] = value;
    if (field === 'id_number' && value.length >= 6) {
      const dob = this.getDOBFromID(value);
      if (dob) this.form.date_of_birth = dob;
    }
  }

  async uploadDocument(beneficiaryId: string, file: File | null, type: string) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      await firstValueFrom(this.api.uploadBeneficiaryDocument(beneficiaryId, formData));
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to upload document';
    }
  }

  async saveBeneficiary() {
    this.formLoading = true;
    this.clearMessages();
    try {
      let beneficiaryId: string;
      if (this.editing) {
        await firstValueFrom(this.api.updateBeneficiary(this.editing.id, this.form));
        beneficiaryId = this.editing.id;
        this.infoMsg = 'Beneficiary updated';
      } else {
        const data = await firstValueFrom(this.api.addBeneficiary(this.form));
        beneficiaryId = data.id;
        this.infoMsg = 'Beneficiary added';
      }

      // Upload documents
      await this.uploadDocument(beneficiaryId, this.idFile, 'id');
      await this.uploadDocument(beneficiaryId, this.addressFile, 'address');
      await this.uploadDocument(beneficiaryId, this.relationshipFile, 'relationship');

      this.closeForm();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to save beneficiary';
    } finally {
      this.formLoading = false;
    }
  }

  async deleteBeneficiary(beneficiary: Beneficiary) {
    this.clearMessages();
    try {
      await firstValueFrom(this.api.deleteBeneficiary(beneficiary.id));
      this.infoMsg = 'Beneficiary removed';
      this.confirmDelete = null;
      this.fetchBeneficiaries();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to delete beneficiary';
    }
  }

  onFileChange(field: 'idFile' | 'addressFile' | 'relationshipFile', event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this[field] = file;
  }

  selectBeneficiary(beneficiary: Beneficiary) {
    this.selectedBeneficiary = beneficiary;
    this.previewDoc = null;
  }

  previewDocument(url: string | undefined, type: string, label: string) {
    if (!url) {
      alert('No document uploaded yet.');
      return;
    }
    this.previewDoc = { url, type: this.getFileType(url), label };
  }
}

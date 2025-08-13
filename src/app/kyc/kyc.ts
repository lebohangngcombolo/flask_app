import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

type KycStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'not_submitted';

interface KYCFormData {
  personal: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    phone: string;
    email: string;
    employmentStatus: string; // employed | unemployed | student
    employerName: string; // employer or university
  };
  address: {
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  income: {
    monthlyIncome: string;
    incomeSource: string;
    employmentType: string; // Full-time...
  };
  bank: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    branchCode: string;
  };
  documents: {
    idDocument?: File | null;
    proofOfAddress?: File | null;
    proofOfIncome?: File | null;
    bankStatement?: File | null;
  };
}

@Component({
  selector: 'app-kyc',
  standalone: true,
  templateUrl: './kyc.html',
  styleUrls: ['./kyc.scss'],
  imports: [CommonModule, FormsModule]
})
export class Kyc implements OnInit {
  activeTab: 'personal' | 'address' | 'income' | 'bank' | 'documents' = 'personal';

  formData: KYCFormData = {
    personal: { fullName: '', dateOfBirth: '', idNumber: '', phone: '', email: '', employmentStatus: '', employerName: '' },
    address: { streetAddress: '', city: '', province: '', postalCode: '', country: 'South Africa' },
    income: { monthlyIncome: '', incomeSource: '', employmentType: '' },
    bank: { bankName: '', accountNumber: '', accountType: '', branchCode: '' },
    documents: { idDocument: null, proofOfAddress: null, proofOfIncome: null, bankStatement: null }
  };

  kycStatus: { status: KycStatus; rejection_reason?: string; submitted_at?: string } = { status: 'draft' };

  isSubmitting = false;
  isLoading = true;

  uploadedDocuments: Record<string, string> = {};
  uploadingDocuments: Record<string, boolean> = {};

  showSuccessModal = false;
  showErrorModal = false;
  modalMessage = '';
  showCongrats = true;

  provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];
  employmentTypes = ['Full-time', 'Part-time', 'Self-employed', 'Contract', 'Internship', 'Unemployed', 'Student'];
  bankNames = ['Absa','African Bank','Capitec','Discovery Bank','FNB','Nedbank','Standard Bank','TymeBank'];
  accountTypes = ['Cheque / Current','Savings','Credit','Transmission'];
  bankBranchCodes: Record<string, string> = {
    Absa: '632005', 'African Bank': '430000', Capitec: '470010', 'Discovery Bank': '679000',
    FNB: '250655', Nedbank: '198765', 'Standard Bank': '051001', TymeBank: '678910'
  };
  universities = [
    'University of Cape Town','University of the Witwatersrand','Stellenbosch University','University of Pretoria',
    'University of KwaZulu-Natal','University of Johannesburg','University of the Western Cape','University of Limpopo',
    'University of Fort Hare','University of Venda','University of Zululand','University of the Free State',
    'North-West University','University of Mpumalanga','Sol Plaatje University','Sefako Makgatho Health Sciences University',
    'Cape Peninsula University of Technology','Central University of Technology','Durban University of Technology',
    'Mangosuthu University of Technology','Tshwane University of Technology','Vaal University of Technology',
    'Walter Sisulu University','Nelson Mandela University','Rhodes University','University of South Africa (UNISA)','Other'
  ];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await Promise.all([this.fetchUserProfile(), this.fetchKYCStatus()]);
    this.isLoading = false;
  }

  async fetchUserProfile() {
    try {
      const user = await this.api.getUserProfile().toPromise();
      this.formData.personal.fullName = user?.name || user?.full_name || '';
      this.formData.personal.email = user?.email || '';
      this.formData.personal.phone = user?.phone || user?.phone_number || '';
      this.formData.personal.dateOfBirth = user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '';
      this.formData.personal.employmentStatus = user?.employment_status || '';
    } catch {}
  }

  async fetchKYCStatus() {
    try {
      const data = await this.api.getKycStatus().toPromise();
      if (data && data.status !== 'not_submitted') {
        this.kycStatus = {
          status: data.status,
          rejection_reason: data.rejection_reason,
          submitted_at: data.created_at
        };
        // Map existing data into form
        this.formData = {
          personal: {
            fullName: data.full_name || this.formData.personal.fullName,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : this.formData.personal.dateOfBirth,
            idNumber: data.id_number || '',
            phone: data.phone || this.formData.personal.phone,
            email: data.email || this.formData.personal.email,
            employmentStatus: data.employment_status || this.formData.personal.employmentStatus,
            employerName: data.employer_name || ''
          },
          address: {
            streetAddress: data.street_address || '',
            city: data.city || '',
            province: data.province || '',
            postalCode: data.postal_code || '',
            country: data.country || 'South Africa'
          },
          income: {
            monthlyIncome: data.monthly_income ? String(data.monthly_income) : '',
            incomeSource: data.income_source || '',
            employmentType: data.employment_type || ''
          },
          bank: {
            bankName: data.bank_name || '',
            accountNumber: data.account_number || '',
            accountType: data.account_type || '',
            branchCode: data.branch_code || ''
          },
          documents: { idDocument: null, proofOfAddress: null, proofOfIncome: null, bankStatement: null }
        };
      } else {
        this.kycStatus = { status: 'draft' };
      }
    } catch {
      this.kycStatus = { status: 'draft' };
    }
  }

  // Validation
  extractDateFromID(idNumber: string) {
    if (idNumber.length !== 13) return null;
    const yy = idNumber.substring(0, 2);
    const month = idNumber.substring(2, 4);
    const day = idNumber.substring(4, 6);
    const currentYear = new Date().getFullYear() % 100;
    const idYear = parseInt(yy, 10);
    const fullYear = idYear <= currentYear ? 2000 + idYear : 1900 + idYear;
    return `${fullYear}-${month}-${day}`;
  }
  validateIDNumber(idNumber: string) {
    if (idNumber.length !== 13) return false;
    if (!/^\d{13}$/.test(idNumber)) return false;
    const m = parseInt(idNumber.substring(2, 4), 10);
    const d = parseInt(idNumber.substring(4, 6), 10);
    if (m < 1 || m > 12) return false;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (d < 1 || d > daysInMonth[m - 1]) return false;
    return true;
  }
  validatePersonal() {
    const e: string[] = [];
    const p = this.formData.personal;
    if (!p.fullName.trim()) e.push('Full Name is required');
    if (!p.dateOfBirth) e.push('Date of Birth is required');
    if (!p.idNumber.trim()) e.push('ID Number is required');
    if (p.idNumber.trim().length !== 13) e.push('ID Number must be exactly 13 digits');
    if (p.idNumber.length === 13 && !this.validateIDNumber(p.idNumber)) e.push('ID Number contains invalid date information');
    if (p.dateOfBirth && p.idNumber.length === 13) {
      const idDate = this.extractDateFromID(p.idNumber);
      if (idDate && p.dateOfBirth !== idDate) e.push('Date of Birth does not match the date in your ID Number');
    }
    if (!p.phone.trim()) e.push('Phone is required');
    if (!p.email.trim()) e.push('Email is required');
    if (!p.employmentStatus) e.push('Employment Status is required');
    if (p.employmentStatus === 'employed' && !p.employerName.trim()) e.push('Employer Name is required');
    if (p.employmentStatus === 'student' && !p.employerName.trim()) e.push('University is required');
    return e;
  }
  validateAddress() {
    const a = this.formData.address, e: string[] = [];
    if (!a.streetAddress.trim()) e.push('Street Address is required');
    if (!a.city.trim()) e.push('City is required');
    if (!a.province) e.push('Province is required');
    if (!a.postalCode.trim()) e.push('Postal Code is required');
    return e;
  }
  validateIncome() {
    const i = this.formData.income, e: string[] = [];
    if (!i.monthlyIncome.trim()) e.push('Monthly Income is required');
    if (!i.incomeSource.trim()) e.push('Source of Income is required');
    if (!i.employmentType) e.push('Employment Type is required');
    return e;
  }
  validateBank() {
    const b = this.formData.bank, e: string[] = [];
    if (!b.bankName) e.push('Bank Name is required');
    if (!b.accountNumber.trim()) e.push('Account Number is required');
    if (!b.accountType) e.push('Account Type is required');
    if (!b.branchCode.trim()) e.push('Branch Code is required');
    return e;
  }
  validateDocuments() {
    const d = this.formData.documents, e: string[] = [];
    if (!d.idDocument) e.push('ID Document is required');
    if (!d.proofOfAddress) e.push('Proof of Address is required');
    return e;
  }

  async saveKYCSection(section: keyof Omit<KYCFormData, 'documents'>) {
    const payload: any = { [section]: this.formData[section] };
    await this.api.updateKycSection(payload).toPromise();
  }

  async handleSaveAndContinue(nextTab: Kyc['activeTab']) {
    let errors: string[] = [];
    if (this.activeTab === 'personal') errors = this.validatePersonal();
    if (this.activeTab === 'address') errors = this.validateAddress();
    if (this.activeTab === 'income') errors = this.validateIncome();
    if (this.activeTab === 'bank') errors = this.validateBank();
    if (this.activeTab === 'documents') errors = this.validateDocuments();

    if (errors.length) {
      this.modalMessage = `Please fill in all required fields:\n${errors.join('\n')}`;
      this.showErrorModal = true;
      return;
    }
    await this.saveKYCSection(this.activeTab as keyof Omit<KYCFormData, 'documents'>);
    this.activeTab = nextTab;
  }

  onBankChange(bankName: string) {
    this.formData.bank.bankName = bankName;
    this.formData.bank.branchCode = this.bankBranchCodes[bankName] || '';
  }

  async handleDocumentUpload(field: keyof KYCFormData['documents'], file: File | null) {
    this.formData.documents[field] = file;
    if (!file) { this.uploadedDocuments[field] = ''; return; }

    this.uploadingDocuments[field] = true;
    try {
      const fd = new FormData();
      fd.append(`documents.${field}`, file);
      await this.api.updateKycFormData(fd).toPromise();
      this.uploadedDocuments[field] = 'Uploaded';
    } catch (e: any) {
      this.modalMessage = e?.message || 'Failed to upload document. Please try again.';
      this.showErrorModal = true;
      this.formData.documents[field] = null;
      this.uploadedDocuments[field] = '';
    } finally {
      this.uploadingDocuments[field] = false;
    }
  }

  onFileChange(field: keyof KYCFormData['documents'], event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.handleDocumentUpload(field, file);
  }

  get uploadingAny(): boolean {
    return Object.values(this.uploadingDocuments).some(Boolean);
  }

  async submitForVerification() {
    // Validate all
    const allErrors = [
      ...this.validatePersonal(),
      ...this.validateAddress(),
      ...this.validateIncome(),
      ...this.validateBank(),
      ...this.validateDocuments()
    ];
    if (allErrors.length) {
      this.modalMessage = `Please complete all required fields before submitting:\n${allErrors.join('\n')}`;
      this.showErrorModal = true;
      return;
    }
    this.isSubmitting = true;
    try {
      await this.api.submitKyc().toPromise();
      this.modalMessage = 'Your KYC information has been submitted successfully for verification!';
      this.showSuccessModal = true;
      this.kycStatus.status = 'pending';
    } catch (e: any) {
      this.modalMessage = e?.message || 'An unexpected error occurred during submission.';
      this.showErrorModal = true;
    } finally {
      this.isSubmitting = false;
    }
  }
}

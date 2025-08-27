import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api';

interface Group {
  id: number;
  name: string;
  category: string;
  tier: string;
  contribution_amount: number;
  interest_rate?: string;
  description: string;
}

interface Member {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
}

interface Card {
  id: number;
  card_type: string;
  card_number_last4?: string;
  card_number?: string;
  expiry?: string;
  expiry_date?: string;
}

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.html',
  styleUrls: ['./group-details.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class GroupDetailsComponent implements OnInit {
  group: Group | null = null;
  members: Member[] = [];
  loading = true;
  contributionAmount: number | null = null;
  paymentMethod: 'wallet' | 'bank' = 'wallet';
  contributionStatus: string | null = null;
  walletBalance = 0;
  cards: Card[] = [];
  selectedCardId: number | null = null;
  showConfirmModal = false;
  showSuccessModal = false;
  pendingPayment = false;

  // Add Number for template access
  Number = Number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const groupId = params['groupId'];
      if (groupId) {
        this.fetchGroup(groupId);
      }
    });
  }

  async fetchGroup(groupId: string) {
    this.loading = true;
    try {
      // Fetch group info
      const groupRes = await this.apiService.getGroup(groupId).toPromise();
      this.group = groupRes;
      this.contributionAmount = groupRes.contribution_amount || 0;

      // Fetch members
      const membersRes = await this.apiService.getGroupMembers(groupId).toPromise();
      this.members = membersRes || []; // Fix: Add fallback to empty array

      // Fetch wallet balance and cards
      await this.fetchWalletData();
    } catch (err) {
      console.error('Failed to fetch group:', err);
      this.router.navigate(['/dashboard/stokvel-groups']);
    } finally {
      this.loading = false;
    }
  }

  async fetchWalletData() {
    try {
      if (this.paymentMethod === 'wallet') {
        const walletRes = await this.apiService.getWalletBalance().toPromise();
        this.walletBalance = walletRes.balance || 0;
      } else if (this.paymentMethod === 'bank') {
        // Temporarily disable bank payment since API method doesn't exist
        this.paymentMethod = 'wallet';
        this.cards = [];
        console.log('Bank payment temporarily disabled - API method not implemented');
      }
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    }
  }

  onPaymentMethodChange(method: 'wallet' | 'bank') {
    this.paymentMethod = method;
    this.fetchWalletData();
  }

  handleContinue() {
    this.showConfirmModal = true;
  }

  async handleConfirmContribution() {
    this.showConfirmModal = false;
    this.pendingPayment = true;
    this.contributionStatus = null;

    try {
      const payload: any = {
        amount: this.contributionAmount,
        method: this.paymentMethod,
      };

      if (this.paymentMethod === 'bank') {
        payload.card_id = this.selectedCardId;
      }

      await this.apiService.contributeToGroup(this.group!.id, payload).toPromise();
      this.contributionStatus = 'Contribution successful!';
      this.showSuccessModal = true;
    } catch (err: any) {
      this.contributionStatus = err.error?.error || 'Contribution failed.';
    } finally {
      this.pendingPayment = false;
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/dashboard']);
  }

  get isContinueDisabled(): boolean {
    return (
      this.pendingPayment ||
      !this.contributionAmount ||
      (this.paymentMethod === 'wallet' && this.walletBalance < this.contributionAmount) ||
      (this.paymentMethod === 'bank' && !this.selectedCardId)
    );
  }

  get selectedCard(): Card | undefined {
    return this.cards.find(c => c.id === this.selectedCardId);
  }

  get cardDisplayName(): string {
    if (!this.selectedCard) return '';
    const card = this.selectedCard;
    const last4 = card.card_number_last4 || card.card_number?.slice(-4) || '****';
    const expiry = card.expiry || card.expiry_date || 'N/A';
    return `${card.card_type.toUpperCase()} ****${last4} (Exp: ${expiry})`;
  }

  // Navigation methods for template
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToGroups() {
    this.router.navigate(['/dashboard/stokvel-groups']);
  }

  onAmountInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.contributionAmount = Number(target.value);
  }

  onCardSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCardId = Number(target.value);
  }
}

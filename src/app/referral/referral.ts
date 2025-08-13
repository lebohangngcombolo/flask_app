import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api';
import { AuthService } from '../auth';
import { Router } from '@angular/router';

export interface Reward {
  key: string;
  description: string;
  points: number;
  image?: string;
}

export interface Referral {
  name: string;
  email: string;
  status: 'pending' | 'completed';
  points: number;
}

@Component({
  selector: 'app-referral',
  templateUrl: './referral.html',
  styleUrls: ['./referral.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ReferralComponent implements OnInit {
  referralDetails: any = null;
  referrals: Referral[] = [];
  selectedReward: Reward | null = null;
  loading = true;
  error: string | null = null;
  
  completedReferrals = 0;
  totalPoints = 0;

  rewards: Reward[] = [
    { key: 'airtime_10', description: 'R10 Airtime', points: 50, image: 'https://cdn-icons-png.flaticon.com/512/724/724664.png' },
    { key: 'voucher_50', description: 'R50 Voucher', points: 200, image: 'https://img.icons8.com/ios-filled/100/4682B4/shopping-basket-2.png' },
    { key: 'credit_100', description: 'R100 Credit', points: 350, image: 'https://img.icons8.com/ios-filled/100/4169E1/wallet-app.png' },
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await Promise.all([
        this.loadReferralDetails(),
        this.loadReferrals()
      ]);
    } catch (error: any) {
      this.error = error?.message || 'Failed to load referral data';
    } finally {
      this.loading = false;
    }
  }

  private async loadReferralDetails() {
    try {
      this.referralDetails = await this.api.getUserReferralDetails().toPromise();
    } catch (error) {
      console.error('Failed to load referral details:', error);
      // Fallback data
      this.referralDetails = {
        referral_link: 'http://localhost:4200/signup?ref=540998',
        points: 0
      };
    }
  }

  private async loadReferrals() {
    try {
      const referralsData = await this.api.getUserReferrals().toPromise();
      this.referrals = referralsData || [];
    } catch (error) {
      console.error('Failed to load referrals:', error);
      // Fallback to mock data
      this.referrals = [
        { name: 'Bongiwe', email: 'leano@gmail.com', status: 'pending', points: 0 },
        { name: 'Ntando', email: 'ntandombele7@gmail.com', status: 'pending', points: 0 },
        { name: 'Ntando', email: 'ntandombele15@gmail.com', status: 'completed', points: 30 },
        { name: 'Leano', email: 'leanoncebo@gmail.com', status: 'completed', points: 30 },
      ];
    }
    this.updateStats();
  }

  private updateStats() {
    this.completedReferrals = this.referrals.filter(ref => ref.status === 'completed').length;
    this.totalPoints = this.referrals.reduce((sum, ref) => sum + ref.points, 0);
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.referralDetails?.referral_link || '');
      console.log('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }

  async shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ url: this.referralDetails?.referral_link || '' });
      } catch (error) {
        console.error('Failed to share:', error);
        this.copyLink();
      }
    } else {
      this.copyLink();
    }
  }

  selectReward(reward: Reward) {
    this.selectedReward = reward;
  }

  closeModal() {
    this.selectedReward = null;
  }

  async redeemReward(reward: Reward) {
    try {
      await this.api.redeemPoints(reward).toPromise();
      this.selectedReward = null;
      // Update points in UI
      if (this.referralDetails) {
        this.referralDetails.points = (this.referralDetails.points || 0) - reward.points;
      }
      console.log('Reward redeemed successfully!');
    } catch (error) {
      console.error('Redemption failed:', error);
    }
  }

  // Add the missing trackBy methods
  trackByReferral(index: number, referral: Referral): string {
    return referral.email;
  }

  trackByReward(index: number, reward: Reward): string {
    return reward.key;
  }
}
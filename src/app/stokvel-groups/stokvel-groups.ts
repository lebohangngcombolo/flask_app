import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api';

export interface TierDetails {
  amountRange: string;
  interest: string;
  access: string;
  description: string;
  support: string;
}

export interface CategoryTier {
  name: string;
  amount: string;
  color: string;
}

export interface JoinRequest {
  groupId: number;
  groupName: string;
  category: string;
  tier: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: string;
}

@Component({
  selector: 'app-stokvel-groups',
  templateUrl: './stokvel-groups.html',
  styleUrls: ['./stokvel-groups.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StokvelGroupsComponent implements OnInit {
  search = '';
  activeCategory = '';
  joinRequests: JoinRequest[] = [];
  loading = true;
  selectedCategory = 'Savings';
  openTier: { name: string; category: string } | null = null;
  selectedAmount: number | null = null;
  confirming = false;
  availableGroups: any[] = [];

  tierDetails: Record<string, Record<string, TierDetails>> = {
    Savings: {
      Bronze: {
        amountRange: "R200–R450",
        interest: "2.5% p.a.",
        access: "Anytime",
        description: "Perfect for individuals or small groups starting their savings journey. Flexible deposits and easy withdrawals.",
        support: "Basic support"
      },
      Silver: {
        amountRange: "R500–R950",
        interest: "3.2% p.a.",
        access: "Anytime",
        description: "Ideal for growing savings groups looking for better rates and more flexibility.",
        support: "Priority support"
      },
      Gold: {
        amountRange: "R1000–R1950",
        interest: "4.1% p.a.",
        access: "Anytime",
        description: "Best for established groups wanting higher limits and added perks.",
        support: "Premium support"
      },
      Platinum: {
        amountRange: "R2000+",
        interest: "5.0% p.a.",
        access: "Anytime",
        description: "Premium tier for large groups seeking maximum benefits and exclusive features.",
        support: "24/7 VIP support"
      }
    },
    Burial: {
      Bronze: {
        amountRange: "R100–R300",
        interest: "1.0% p.a.",
        access: "On claim",
        description: "Entry-level burial stokvel for basic funeral cover and support.",
        support: "Basic support"
      },
      Silver: {
        amountRange: "R350–R700",
        interest: "1.5% p.a.",
        access: "On claim",
        description: "Enhanced cover for families and small communities.",
        support: "Priority support"
      },
      Gold: {
        amountRange: "R750–R1500",
        interest: "2.0% p.a.",
        access: "On claim",
        description: "Comprehensive burial benefits for larger groups.",
        support: "Premium support"
      },
      Platinum: {
        amountRange: "R1600+",
        interest: "2.5% p.a.",
        access: "On claim",
        description: "Top-tier cover with additional family and community benefits.",
        support: "24/7 VIP support"
      }
    },
    Investment: {
      Bronze: {
        amountRange: "R500–R1000",
        interest: "4.0% p.a.",
        access: "Quarterly",
        description: "Start your investment journey with low minimums and steady returns.",
        support: "Basic support"
      },
      Silver: {
        amountRange: "R1100–R2500",
        interest: "5.0% p.a.",
        access: "Quarterly",
        description: "Better rates for groups with a medium-term investment horizon.",
        support: "Priority support"
      },
      Gold: {
        amountRange: "R2600–R5000",
        interest: "6.0% p.a.",
        access: "Bi-Annually",
        description: "Higher returns for committed investment stokvels.",
        support: "Premium support"
      },
      Platinum: {
        amountRange: "R5100+",
        interest: "7.0% p.a.",
        access: "Annually",
        description: "Maximum growth for long-term, high-value investment groups.",
        support: "24/7 VIP support"
      }
    },
    Business: {
      Bronze: {
        amountRange: "R1000–R2500",
        interest: "3.0% p.a.",
        access: "Monthly",
        description: "For small business stokvels pooling resources for growth.",
        support: "Basic support"
      },
      Silver: {
        amountRange: "R2600–R5000",
        interest: "3.8% p.a.",
        access: "Monthly",
        description: "Ideal for growing business collectives needing flexible access.",
        support: "Priority support"
      },
      Gold: {
        amountRange: "R5100–R10000",
        interest: "4.5% p.a.",
        access: "Quarterly",
        description: "Higher limits and returns for established business stokvels.",
        support: "Premium support"
      },
      Platinum: {
        amountRange: "R10100+",
        interest: "5.5% p.a.",
        access: "Quarterly",
        description: "Top-tier for large business groups with exclusive benefits.",
        support: "24/7 VIP support"
      }
    }
  };

  categoryTiers: Record<string, CategoryTier[]> = {
    Savings: [
      { name: "Bronze", amount: "R300", color: "bg-green-100 text-green-800" },
      { name: "Silver", amount: "R700", color: "bg-green-200 text-green-900" },
      { name: "Gold", amount: "R1500", color: "bg-green-300 text-green-900" },
      { name: "Platinum", amount: "R3000", color: "bg-green-400 text-white" },
    ],
    Burial: [
      { name: "Bronze", amount: "R150", color: "bg-blue-100 text-blue-800" },
      { name: "Silver", amount: "R400", color: "bg-blue-200 text-blue-900" },
      { name: "Gold", amount: "R900", color: "bg-blue-300 text-blue-900" },
      { name: "Platinum", amount: "R1600", color: "bg-blue-400 text-white" },
    ],
    Investment: [
      { name: "Bronze", amount: "R500", color: "bg-purple-100 text-purple-800" },
      { name: "Silver", amount: "R1200", color: "bg-purple-200 text-purple-900" },
      { name: "Gold", amount: "R2500", color: "bg-purple-300 text-purple-900" },
      { name: "Platinum", amount: "R5100", color: "bg-purple-400 text-white" },
    ],
    Business: [
      { name: "Bronze", amount: "R250", color: "bg-yellow-100 text-yellow-800" },
      { name: "Silver", amount: "R600", color: "bg-yellow-200 text-yellow-900" },
      { name: "Gold", amount: "R1200", color: "bg-yellow-300 text-yellow-900" },
      { name: "Platinum", amount: "R2500", color: "bg-yellow-400 text-white" },
    ],
  };

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    try {
      await Promise.all([
        this.fetchGroups(),
        this.fetchRequests()
      ]);
    } catch (error) {
      console.error('Failed to load stokvel groups data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async fetchGroups() {
    try {
      const groups = await firstValueFrom(this.apiService.getAvailableGroups());
      const uniqueCategories = [...new Set(groups.map((group: any) => group.category))];
      if (uniqueCategories.length > 0 && !this.activeCategory) {
        this.activeCategory = String(uniqueCategories[0]);
      }
      
      // Store the actual groups for navigation
      this.availableGroups = groups;
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }

  private async fetchRequests() {
    try {
      const data = await firstValueFrom(this.apiService.getUserJoinRequests());
      this.joinRequests = data.map((req: any) => ({
        groupId: req.group_id,
        groupName: req.group_name,
        category: req.category,
        tier: req.tier,
        amount: req.amount,
        status: req.status,
        reason: req.reason,
        createdAt: req.created_at,
      }));
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
    }
  }

  getRequestStatus(category: string, tier: string, amount: number): JoinRequest | undefined {
    return this.joinRequests.find(
      req => req.category === category && req.tier === tier && req.amount === amount
    );
  }

  getAmountsInRange(range: string): number[] {
    const match = range.match(/R(\d+)[–-]R?(\d+)?/);
    if (!match) return [];
    const min = parseInt(match[1], 10);
    const max = match[2] ? parseInt(match[2], 10) : min;
    let amounts = [];
    for (let amt = min; amt <= max; amt += 50) {
      amounts.push(amt);
    }
    // If range is open-ended (e.g., "R1600+"), add a few more options
    if (!max || range.includes("+")) {
      for (let amt = min + 50; amt <= min + 300; amt += 50) {
        amounts.push(amt);
      }
    }
    return amounts;
  }

  async handleJoin() {
    if (!this.openTier || !this.selectedAmount) return;
    this.confirming = true;
    try {
      await firstValueFrom(this.apiService.joinGroup({
        category: this.openTier.category,
        tier: this.openTier.name,
        amount: this.selectedAmount,
      }));
      console.log('Join request sent successfully!');
      this.openTier = null;
      this.selectedAmount = null;
      await this.fetchRequests();
    } catch (error) {
      console.error('Failed to submit join request:', error);
    } finally {
      this.confirming = false;
    }
  }

  openTierModal(tier: CategoryTier) {
    this.openTier = { name: tier.name, category: this.selectedCategory };
    this.selectedAmount = null;
  }

  closeModal() {
    this.openTier = null;
    this.selectedAmount = null;
  }

  goToMyGroups() {
    this.router.navigate(['/dashboard/my-groups']);
  }

  // Add this method to navigate to group details
  viewGroupDetails(groupId: number) {
    this.router.navigate(['/dashboard/groups', groupId]);
  }

  getTierIcon(tierName: string): string {
    switch (tierName) {
      case 'Bronze': return '🥉';
      case 'Silver': return '🥈'; // Fixed missing emoji
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      default: return '⭐';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return '✓';
      case 'pending': return '⏳';
      case 'rejected': return '✗';
      default: return '•';
    }
  }

  getGroupId(category: string, tier: string): number {
    // Find the actual group that matches category and tier
    const group = this.availableGroups.find(g => 
      g.category === category && g.tier === tier
    );
    return group ? group.id : 1; // Return actual group ID or fallback
  }
}

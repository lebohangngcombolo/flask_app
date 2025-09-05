import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

interface StokvelGroup {
  id: number;
  name: string;
  category: string;
  tier: string;
  monthly: number;
  members: number;
  created: string;
  status: 'active' | 'inactive';
}

interface JoinRequest {
  id: number;
  groupName: string;
  groupId: number;
  category: string;
  tier: string;
  monthly: number;
  user: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

const CATEGORIES = [
  { key: "savings", label: "Savings", color: "indigo" },
  { key: "burial", label: "Burial", color: "rose" },
  { key: "investment", label: "Investment", color: "emerald" },
  { key: "business", label: "Business", color: "violet" },
];

const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];
const GROUP_CATEGORIES = ["All", "Savings", "Burial", "Investment", "Business"];
const GROUP_TIERS = ["All", "Bronze", "Silver", "Gold", "Platinum"];
const GROUP_STATUSES = ["All", "Active", "Inactive"];

@Component({
  selector: 'app-stokvel-management',
  templateUrl: './stokvel-management.html',
  styleUrls: ['./stokvel-management.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StokvelManagementComponent implements OnInit {
  // Tab management
  activeTab: 'groups' | 'requests' = 'groups';
  
  // Groups data
  groups: StokvelGroup[] = [];
  groupsLoading = true;
  groupsError: string | null = null;
  
  // Join requests data
  joinRequests: JoinRequest[] = [];
  requestsLoading = true;
  requestsError: string | null = null;
  
  // Filters and search
  searchTerm = '';
  statusFilter = 'all';
  activeCategory = 'savings';
  
  // Groups filters
  groupSearch = '';
  groupCategory = 'All';
  groupTier = 'All';
  groupStatus = 'All';
  currentPage = 1;
  pageSize = 10;
  
  // Modal states
  selectedRequest: JoinRequest | null = null;
  isModalOpen = false;
  showCreateModal = false;
  
  // Constants
  categories = CATEGORIES;
  tiers = TIERS;
  groupCategories = GROUP_CATEGORIES;
  groupTiers = GROUP_TIERS;
  groupStatuses = GROUP_STATUSES;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.fetchGroups();
    this.fetchJoinRequests();
  }

  async fetchGroups(): Promise<void> {
    try {
      this.groupsLoading = true;
      this.groupsError = null;
      
      const response = await this.api.getAdminGroups().toPromise();
      
      if (response && Array.isArray(response)) {
        this.groups = response.map((g: any) => ({
          id: g.id,
          name: g.name,
          category: g.category,
          tier: g.tier,
          monthly: g.monthly || g.contributionAmount || g.amount || 0,
          members: g.memberCount || g.members || 0,
          created: g.createdAt || g.created || g.dateCreated || '',
          status: g.status || (g.is_active ? 'active' : 'inactive')
        }));
      } else {
        this.groups = [];
      }
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      this.groupsError = error.message || 'Failed to fetch groups from database';
      this.groups = [];
    } finally {
      this.groupsLoading = false;
    }
  }

  async fetchJoinRequests(): Promise<void> {
    try {
      this.requestsLoading = true;
      this.requestsError = null;
      
      const response = await this.api.getAdminJoinRequests().toPromise();
      
      if (response && Array.isArray(response)) {
        this.joinRequests = response.map((r: any) => ({
          id: r.id,
          groupName: r.group_name || r.groupName || 'Unknown Group',
          groupId: r.group_id || null,
          category: r.category || 'savings',
          tier: r.tier || 'Bronze',
          monthly: r.amount || 0,
          user: r.user?.name || r.user?.full_name || r.user || 'Unknown User',
          date: r.created_at || new Date().toISOString(),
          status: r.status || 'pending',
          reason: r.reason || ''
        }));
      } else {
        this.joinRequests = [];
      }
    } catch (error: any) {
      console.error('Error fetching join requests:', error);
      this.requestsError = error.message || 'Failed to fetch join requests from database';
      this.joinRequests = [];
    } finally {
      this.requestsLoading = false;
    }
  }

  // Filtered data
  get filteredRequests(): JoinRequest[] {
    return this.joinRequests.filter(request => {
      const userName = (request.user || '').toLowerCase();
      const groupName = (request.groupName || '').toLowerCase();
      const searchLower = this.searchTerm.toLowerCase();
      
      const matchesSearch = userName.includes(searchLower) || groupName.includes(searchLower);
      const matchesStatus = this.statusFilter === 'all' || request.status === this.statusFilter;
      const matchesCategory = (request.category || 'savings').toLowerCase() === this.activeCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  get groupedRequests(): { [key: string]: JoinRequest[] } {
    const grouped: { [key: string]: JoinRequest[] } = {};
    this.categories.forEach(cat => {
      grouped[cat.key] = this.filteredRequests.filter(r => 
        (r.category || 'savings').toLowerCase() === cat.key
      );
    });
    return grouped;
  }

  get filteredGroups(): StokvelGroup[] {
    return this.groups.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(this.groupSearch.toLowerCase());
      const matchesCategory = this.groupCategory === 'All' || g.category === this.groupCategory;
      const matchesTier = this.groupTier === 'All' || g.tier === this.groupTier;
      const matchesStatus = this.groupStatus === 'All' || g.status.toLowerCase() === this.groupStatus.toLowerCase();
      return matchesSearch && matchesCategory && matchesTier && matchesStatus;
    });
  }

  get paginatedGroups(): StokvelGroup[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredGroups.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGroups.length / this.pageSize);
  }

  // Helper method to check if all grouped requests are empty
  get hasNoRequests(): boolean {
    return Object.values(this.groupedRequests).every(requests => requests.length === 0);
  }

  // Helper methods for template
  getCategoryRequests(categoryKey: string): JoinRequest[] {
    return this.groupedRequests[categoryKey] || [];
  }

  getCategoryRequestCount(categoryKey: string): number {
    return this.getCategoryRequests(categoryKey).length;
  }

  getCategoryPendingCount(categoryKey: string): number {
    return this.getCategoryRequests(categoryKey).filter(r => r.status === 'pending').length;
  }

  // Action handlers
  async approveRequest(id: number): Promise<void> {
    try {
      await this.api.approveJoinRequest(id).toPromise();
      await this.fetchJoinRequests(); // Refresh the list
      console.log('Request approved successfully');
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please try again.');
    }
  }

  async rejectRequest(id: number): Promise<void> {
    try {
      await this.api.rejectJoinRequest(id, { reason: 'Request rejected by admin' }).toPromise();
      await this.fetchJoinRequests(); // Refresh the list
      console.log('Request rejected successfully');
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    }
  }

  viewRequest(id: number): void {
    const request = this.joinRequests.find(r => r.id === id);
    if (request) {
      this.selectedRequest = request;
      this.isModalOpen = true;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRequest = null;
  }

  // Group actions
  viewGroup(group: StokvelGroup): void {
    console.log('View group:', group);
    // TODO: Implement group view modal
  }

  editGroup(group: StokvelGroup): void {
    console.log('Edit group:', group);
    // TODO: Implement group edit modal
  }

  deleteGroup(group: StokvelGroup): void {
    if (confirm(`Delete group "${group.name}"?`)) {
      console.log('Delete group:', group);
      // TODO: Implement group deletion
    }
  }

  // Pagination
  goToPage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'active': return 'bg-emerald-50 text-emerald-700';
      case 'inactive': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  getCategoryColorClass(category: string): string {
    const cat = this.categories.find(c => c.key === category);
    if (!cat) return 'text-indigo-600 bg-indigo-50';
    
    switch (cat.color) {
      case 'indigo': return 'text-indigo-600 bg-indigo-50';
      case 'rose': return 'text-rose-600 bg-rose-50';
      case 'emerald': return 'text-emerald-600 bg-emerald-50';
      case 'violet': return 'text-violet-600 bg-violet-50';
      default: return 'text-indigo-600 bg-indigo-50';
    }
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  }

  formatAmount(amount: number): string {
    return `R ${amount.toLocaleString()}`;
  }
}
